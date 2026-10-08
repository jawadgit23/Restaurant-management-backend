/* eslint-disable no-console */
const env = require('../config/env');
const { connectDB, disconnectDB } = require('../config/database');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const data = require('./menu.json'); // generated from the dashboard's original mock data

const ADMIN_PASSWORD = process.env.SEED_SUPER_ADMIN_PASSWORD || 'Admin@12345';
const USER_PASSWORD = process.env.SEED_USER_PASSWORD || 'Password123!';

const SMASH_CATEGORIES = ['Burgers', 'Chicken', 'Pizza', 'Sandwiches', 'Rolls', 'Sides', 'Shakes', 'Beverages', 'Desserts'];

async function seedUsers() {
  // create() (not insertMany) so the bcrypt pre-save hook runs
  const make = (u) => User.create(u);
  const superAdmin = await make({ name: 'Super Admin', email: 'admin@areebarestaurant.pk', password: ADMIN_PASSWORD, phone: '+923001111111', role: 'admin' });
  const owner1 = await make({ name: 'Ahmed Khan', email: 'ahmed@areebarestaurant.pk', password: USER_PASSWORD, phone: '+923342795293', role: 'restaurant_admin' });
  const owner2 = await make({ name: 'Sara Ali', email: 'sara@smashhouse.pk', password: USER_PASSWORD, phone: '+923122766999', role: 'restaurant_admin' });
  const customers = [];
  for (const [name, email, phone] of [
    ['John Doe', 'john@example.com', '+923001234567'],
    ['Fatima Noor', 'fatima@example.com', '+923211234567'],
    ['Bilal Hussain', 'bilal@example.com', '+923331234567'],
  ]) customers.push(await make({ name, email, password: USER_PASSWORD, phone, role: 'customer' }));
  return { superAdmin, owner1, owner2, customers };
}

async function seedMenu(restaurant, items) {
  const names = [...new Set(items.map((i) => i.category))];
  const cats = {};
  for (const [idx, name] of names.entries()) {
    cats[name] = await Category.create({ restaurant: restaurant._id, name, description: `${name} at ${restaurant.name}`, sortOrder: idx + 1 });
  }
  const docs = items.map((i) => ({
    restaurant: restaurant._id,
    category: cats[i.category]._id,
    name: i.name,
    description: i.description,
    price: i.price,
    image: i.image,
    ingredients: [],
    isAvailable: i.isAvailable,
    stockStatus: i.stockStatus,
    preparationTime: i.category === 'Sajji' || i.category === 'Mandi' ? 35 : i.category === 'Karahi' ? 25 : 15,
    rating: i.rating,
    orderCount: i.orderCount,
  }));
  await MenuItem.insertMany(docs);
  return { categories: names.length, items: docs.length };
}

async function run() {
  await connectDB();
  console.log('Clearing existing data…');
  await Promise.all([User, Restaurant, Category, MenuItem, Cart, Order, Coupon].map((m) => m.deleteMany({})));
  await Promise.all([User, Restaurant, Category, MenuItem, Cart, Order, Coupon].map((m) => m.syncIndexes()));

  const { owner1, owner2 } = await seedUsers();

  const [b1, b2] = data.branches;
  const restaurants = await Restaurant.insertMany([
    { name: b1.name, description: 'Sajji, BBQ, karahi, mandi and smash burgers — the full Areeba menu.', owner: owner1._id, manager: b1.manager, phone: b1.phone, email: 'nazimabad@areebarestaurant.pk', address: b1.address, city: 'Karachi', area: b1.area, image: '', rating: Number(b1.rating), openedOn: b1.opened, openingTime: '11:00', closingTime: '23:59' },
    { name: b2.name, description: 'Our North Nazimabad branch — same fire, same menu.', owner: owner1._id, manager: b2.manager, phone: b2.phone, email: 'northnazimabad@areebarestaurant.pk', address: b2.address, city: 'Karachi', area: b2.area, image: '', rating: Number(b2.rating), openedOn: b2.opened, openingTime: '11:00', closingTime: '23:59' },
    { name: 'Areeba Smash House – Gulshan', description: 'Smash burgers, pizza, rolls, fries and shakes.', owner: owner2._id, manager: 'Sara Ali', phone: '+92 312 2766999', email: 'gulshan@smashhouse.pk', address: 'Shop 4, Block 13-D, Gulshan-e-Iqbal, Karachi', city: 'Karachi', area: 'Gulshan', image: '', rating: 4.5, openedOn: 'Jan 2026', openingTime: '12:00', closingTime: '01:00' },
  ]);

  const stats = [];
  stats.push(await seedMenu(restaurants[0], data.items));
  stats.push(await seedMenu(restaurants[1], data.items));
  stats.push(await seedMenu(restaurants[2], data.items.filter((i) => SMASH_CATEGORIES.includes(i.category))));

  // Coupons from the original dashboard data
  const typeMap = { Percentage: 'percentage', Fixed: 'fixed', 'Free Delivery': 'free_delivery' };
  await Coupon.insertMany(
    data.coupons.map((c) => ({
      restaurant: null, // platform-wide
      code: c.code,
      discountType: typeMap[c.type],
      discountValue: c.value,
      minimumOrder: c.minOrder,
      expiryDate: c.expiry ? new Date(`${c.expiry}T23:59:59Z`) : null,
      usageLimit: c.maxUses,
      usedCount: Math.min(c.uses, c.maxUses),
      isActive: c.status === 'Active',
    }))
  );

  console.log('\nSeed complete\n');
  restaurants.forEach((r, i) => console.log(`  ${r.name}: ${stats[i].categories} categories, ${stats[i].items} menu items`));
  console.log('\nLogins');
  console.log(`  super admin       admin@areebarestaurant.pk   ${ADMIN_PASSWORD}`);
  console.log(`  restaurant admin  ahmed@areebarestaurant.pk   ${USER_PASSWORD}   (Nazimabad + North Nazimabad)`);
  console.log(`  restaurant admin  sara@smashhouse.pk          ${USER_PASSWORD}   (Gulshan)`);
  console.log(`  customers         john@example.com / fatima@example.com / bilal@example.com   ${USER_PASSWORD}`);
  await disconnectDB();
}

run().catch(async (err) => {
  console.error(err);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
