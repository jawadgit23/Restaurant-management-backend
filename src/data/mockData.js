// Central mock data source for the Areeba Restaurant admin dashboard.
// Areeba Restaurant is a Karachi-based desi kitchen and BBQ house with
// 2 branches, known for whole-roasted sajji, mandi platters and live
// grill BBQ, alongside burgers, rolls and fast food.
// In a real app this would come from an API — everything here is
// wired into working local state (add/edit/delete) on each page.

export const NAMES = [
  "Ahmed Khan", "Sara Ali", "Hamza Zia", "Ayesha Malik", "Bilal Ahmed",
  "Fatima Noor", "Usman Tariq", "Zainab Hassan", "Omar Farooq", "Hina Siddiqui",
  "Kamran Shah", "Mahnoor Iqbal", "Talha Riaz", "Sana Javed", "Ali Raza",
  "Mehreen Butt", "Danish Aziz", "Rabia Yousuf", "Faisal Naveed", "Iqra Saeed",
];

const KARACHI_AREAS = [
  "Clifton", "DHA Phase 6", "Gulshan-e-Iqbal", "Bahadurabad", "PECHS",
  "North Nazimabad", "Nazimabad", "Tariq Road", "Malir", "Korangi",
];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const rand = seededRandom(42);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

export function formatPKR(amount) {
  return `Rs ${Math.round(Number(amount)).toLocaleString("en-PK")}`;
}

export const DEFAULT_TAX_RATE = 5; // percent, matches Settings > Store

// ---------- Branches ----------
export const BRANCHES = [
  {
    id: "BR-01",
    name: "Areeba Restaurant – Nazimabad",
    manager: "Ahmed Khan",
    address: "Plot D 1/2, Block 3, Nazimabad, Karachi",
    phone: "+92 334 2795293",
    area: "Nazimabad",
    status: "Active",
    rating: "4.6",
    orders: 1842,
    monthlyRevenue: 3120000,
    opened: "Mar 2022",
  },
  {
    id: "BR-02",
    name: "Areeba Restaurant – North Nazimabad",
    manager: "Sara Ali",
    address: "Al-Habib Complex, Plot B-71, Block L, North Nazimabad, Karachi",
    phone: "+92 312 2766999",
    area: "North Nazimabad",
    status: "Active",
    rating: "4.7",
    orders: 1560,
    monthlyRevenue: 2680000,
    opened: "Nov 2024",
  },
];
export const BRANCH_NAMES = BRANCHES.map((b) => b.name);

// ---------- Menu ----------
export const foodCategories = [
  "Burgers", "Chicken", "Pizza", "Sandwiches", "Rolls", "BBQ",
  "Sajji", "Mandi", "Chargha", "Karahi", "Roti & Naan", "Sides", "Shakes", "Beverages", "Desserts",
];

export const foodItems = [
  // Burgers
  { id: "FD-2001", name: "Classic Smash Burger", category: "Burgers", price: 650, orders: 412, stock: "In Stock", rating: "4.6", available: true, photo: "https://images.pexels.com/photos/36741809/pexels-photo-36741809.jpeg?auto=compress&cs=tinysrgb&w=600", description: "A single smashed beef patty, American cheese, pickles, onions, and our signature sauce." },
  { id: "FD-2002", name: "Double Smash Cheeseburger", category: "Burgers", price: 950, orders: 388, stock: "In Stock", rating: "4.8", available: true, photo: "https://images.pexels.com/photos/10761390/pexels-photo-10761390.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Two smashed beef patties stacked high with double cheese, lettuce, and tomato." },
  { id: "FD-2003", name: "BBQ Bacon Smash", category: "Burgers", price: 1050, orders: 265, stock: "In Stock", rating: "4.7", available: true, photo: "https://images.pexels.com/photos/38673834/pexels-photo-38673834.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Smoky BBQ sauce, crispy beef bacon, caramelized onions, and melted cheddar." },
  { id: "FD-2004", name: "Spicy Chipotle Smash", category: "Burgers", price: 780, orders: 301, stock: "In Stock", rating: "4.5", available: true, photo: "https://images.pexels.com/photos/20722029/pexels-photo-20722029.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Fiery chipotle mayo, jalapeños, and pepper jack cheese for a spicy kick." },
  { id: "FD-2005", name: "Mushroom Melt Smash", category: "Burgers", price: 820, orders: 198, stock: "Low Stock", rating: "4.4", available: true, photo: "https://images.pexels.com/photos/9278698/pexels-photo-9278698.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Sautéed mushrooms and melted Swiss cheese over a juicy smashed patty." },
  { id: "FD-2006", name: "Smash Deluxe Combo", category: "Burgers", price: 1350, orders: 356, stock: "In Stock", rating: "4.9", available: true, photo: "https://images.pexels.com/photos/38975619/pexels-photo-38975619.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Our Classic Smash Burger paired with fries and a soft drink." },
  { id: "FD-2007", name: "Ultimate Stack Smash", category: "Burgers", price: 1150, orders: 174, stock: "In Stock", rating: "4.7", available: true, photo: "https://images.pexels.com/photos/16962445/pexels-photo-16962445.jpeg?auto=compress&cs=tinysrgb&w=600", description: "A triple-stacked tower of beef, cheese, and all the fixings." },

  // Chicken
  { id: "FD-2008", name: "Crispy Chicken Zinger", category: "Chicken", price: 720, orders: 289, stock: "In Stock", rating: "4.5", available: true, photo: "https://images.pexels.com/photos/35438305/pexels-photo-35438305.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Crispy fried chicken fillet, spicy mayo, and fresh lettuce in a soft bun." },

  // Pizza
  { id: "FD-3001", name: "Chicken Tikka Pizza", category: "Pizza", price: 1450, orders: 256, stock: "In Stock", rating: "4.8", available: true, photo: "https://images.pexels.com/photos/31587565/pexels-photo-31587565.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Desi-style chicken tikka, onions, and green chillies on a cheesy base." },
  { id: "FD-3002", name: "Margherita Pizza", category: "Pizza", price: 1100, orders: 187, stock: "In Stock", rating: "4.5", available: true, photo: "https://images.pexels.com/photos/27025471/pexels-photo-27025471.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Classic tomato, fresh mozzarella, and basil on a thin crust." },
  { id: "FD-3003", name: "Pepperoni Pizza", category: "Pizza", price: 1350, orders: 213, stock: "In Stock", rating: "4.7", available: true, photo: "https://images.pexels.com/photos/29173098/pexels-photo-29173098.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Loaded with beef pepperoni and extra melted mozzarella." },
  { id: "FD-3004", name: "Fajita Supreme Pizza", category: "Pizza", price: 1500, orders: 165, stock: "In Stock", rating: "4.6", available: true, photo: "https://images.pexels.com/photos/842519/pexels-photo-842519.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Spicy chicken fajita, bell peppers, and onions with a smoky sauce." },

  // Sandwiches
  { id: "FD-3005", name: "Club Sandwich", category: "Sandwiches", price: 550, orders: 224, stock: "In Stock", rating: "4.5", available: true, photo: "https://images.pexels.com/photos/17942170/pexels-photo-17942170.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Triple-layered chicken, egg, and vegetables on toasted bread." },
  { id: "FD-3006", name: "Grilled Chicken Sandwich", category: "Sandwiches", price: 500, orders: 178, stock: "In Stock", rating: "4.4", available: true, photo: "https://images.pexels.com/photos/6605340/pexels-photo-6605340.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Grilled chicken breast, cheese, and fresh veggies on toasted bread." },

  // Rolls
  { id: "FD-3007", name: "Chicken Seekh Roll", category: "Rolls", price: 380, orders: 245, stock: "In Stock", rating: "4.6", available: true, photo: "https://images.pexels.com/photos/19615781/pexels-photo-19615781.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Spiced chicken seekh kebab wrapped in warm roti with chutney." },
  { id: "FD-3008", name: "Beef Kebab Roll", category: "Rolls", price: 420, orders: 201, stock: "In Stock", rating: "4.7", available: true, photo: "https://images.pexels.com/photos/19615781/pexels-photo-19615781.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Juicy beef kebab, onions, and tamarind chutney rolled in paratha." },

  // BBQ
  { id: "FD-3009", name: "BBQ Platter (Mixed Grill)", category: "BBQ", price: 1800, orders: 142, stock: "In Stock", rating: "4.8", available: true, photo: "https://images.pexels.com/photos/53148/pexels-photo-53148.jpeg?auto=compress&cs=tinysrgb&w=600", description: "An assortment of seekh kebab, chicken tikka, and beef boti fresh off the grill." },
  { id: "FD-3010", name: "Chicken Seekh Kebab (6pc)", category: "BBQ", price: 650, orders: 189, stock: "In Stock", rating: "4.6", available: true, photo: "https://images.pexels.com/photos/53148/pexels-photo-53148.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Six skewers of spiced minced chicken, chargrilled to perfection." },
  { id: "FD-3011", name: "Beef Chapli Kebab", category: "BBQ", price: 700, orders: 156, stock: "In Stock", rating: "4.7", available: true, photo: "https://images.pexels.com/photos/9278698/pexels-photo-9278698.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Peshawari-style flat beef kebab with tomatoes, coriander, and spices." },

  // Sajji — Areeba's signature, whole roasted over live coals
  { id: "FD-4001", name: "Whole Chicken Sajji", category: "Sajji", price: 1800, orders: 268, stock: "In Stock", rating: "4.9", available: true, photo: "https://images.pexels.com/photos/53148/pexels-photo-53148.jpeg?auto=compress&cs=tinysrgb&w=600", description: "A whole chicken marinated in Balochi spices, slow-roasted over coals. Serves 2-3." },
  { id: "FD-4002", name: "Half Chicken Sajji", category: "Sajji", price: 1000, orders: 231, stock: "In Stock", rating: "4.8", available: true, photo: "https://images.pexels.com/photos/53148/pexels-photo-53148.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Half a coal-roasted sajji chicken, served with a light spice rub." },

  // Mandi — Yemeni-style rice platters
  { id: "FD-4003", name: "Chicken Mandi (Full)", category: "Mandi", price: 1600, orders: 214, stock: "In Stock", rating: "4.8", available: true, photo: "https://images.pexels.com/photos/12737917/pexels-photo-12737917.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Slow-cooked chicken over fragrant mandi rice, served with mandi sauce. Serves 2." },
  { id: "FD-4004", name: "Beef Mandi (Full)", category: "Mandi", price: 2200, orders: 132, stock: "In Stock", rating: "4.9", available: true, photo: "https://images.pexels.com/photos/12737917/pexels-photo-12737917.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Tender slow-cooked beef over spiced mandi rice with roasted nuts. Serves 2-3." },

  // Chargha — Lahori-style fried whole chicken
  { id: "FD-4005", name: "Lahori Chargha (Full)", category: "Chargha", price: 1400, orders: 187, stock: "In Stock", rating: "4.7", available: true, photo: "https://images.pexels.com/photos/35438305/pexels-photo-35438305.jpeg?auto=compress&cs=tinysrgb&w=600", description: "A whole chicken marinated overnight, steamed then deep-fried Lahori style." },
  { id: "FD-4006", name: "Lahori Chargha (Half)", category: "Chargha", price: 750, orders: 165, stock: "In Stock", rating: "4.6", available: true, photo: "https://images.pexels.com/photos/35438305/pexels-photo-35438305.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Half a marinated, steamed, and crisp-fried Lahori-style chargha." },


  // Karahi
  { id: "FD-3012", name: "Chicken Karahi (Half)", category: "Karahi", price: 1200, orders: 198, stock: "In Stock", rating: "4.8", available: true, photo: "https://images.pexels.com/photos/12737917/pexels-photo-12737917.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Traditional tomato-based chicken karahi, cooked fresh to order. Serves 2." },
  { id: "FD-3013", name: "Chicken Karahi (Full)", category: "Karahi", price: 2200, orders: 176, stock: "In Stock", rating: "4.8", available: true, photo: "https://images.pexels.com/photos/12737917/pexels-photo-12737917.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Traditional tomato-based chicken karahi, cooked fresh to order. Serves 4." },
  { id: "FD-3014", name: "Mutton Karahi (Full)", category: "Karahi", price: 2800, orders: 98, stock: "In Stock", rating: "4.9", available: true, photo: "https://images.pexels.com/photos/20446401/pexels-photo-20446401.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Slow-cooked tender mutton in a rich, spiced tomato gravy. Serves 4." },

  // Roti & Naan
  { id: "FD-3015", name: "Tandoori Roti", category: "Roti & Naan", price: 40, orders: 512, stock: "In Stock", rating: "4.5", available: true, photo: "https://images.pexels.com/photos/30203311/pexels-photo-30203311.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Freshly baked whole wheat roti straight from the tandoor." },
  { id: "FD-3016", name: "Butter Naan", category: "Roti & Naan", price: 90, orders: 389, stock: "In Stock", rating: "4.7", available: true, photo: "https://images.pexels.com/photos/30203311/pexels-photo-30203311.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Soft leavened flatbread brushed with butter." },
  { id: "FD-3017", name: "Stuffed Aloo Paratha", category: "Roti & Naan", price: 150, orders: 231, stock: "In Stock", rating: "4.6", available: true, photo: "https://images.pexels.com/photos/12737919/pexels-photo-12737919.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Whole wheat flatbread stuffed with spiced mashed potato, served with chutney." },

  // Sides
  { id: "FD-2009", name: "Classic Fries", category: "Sides", price: 350, orders: 512, stock: "In Stock", rating: "4.4", available: true, photo: "https://images.pexels.com/photos/4109234/pexels-photo-4109234.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Golden, crispy salted fries." },
  { id: "FD-2010", name: "Loaded Cheese Fries", category: "Sides", price: 550, orders: 276, stock: "In Stock", rating: "4.7", available: true, photo: "https://images.pexels.com/photos/6941009/pexels-photo-6941009.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Fries loaded with melted cheese sauce and jalapeños." },
  { id: "FD-2011", name: "Peri Peri Fries", category: "Sides", price: 420, orders: 233, stock: "In Stock", rating: "4.5", available: true, photo: "https://images.pexels.com/photos/11485199/pexels-photo-11485199.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Fries tossed in a fiery peri peri seasoning." },
  { id: "FD-2012", name: "Curly Fries", category: "Sides", price: 450, orders: 141, stock: "Out of Stock", rating: "4.3", available: false, photo: "https://images.pexels.com/photos/12946719/pexels-photo-12946719.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Seasoned curly-cut fries, crispy on the outside." },

  // Shakes
  { id: "FD-2013", name: "Chocolate Milkshake", category: "Shakes", price: 480, orders: 345, stock: "In Stock", rating: "4.8", available: true, photo: "https://images.pexels.com/photos/3727250/pexels-photo-3727250.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Rich and creamy chocolate shake topped with whipped cream." },
  { id: "FD-2014", name: "Oreo Cookie Shake", category: "Shakes", price: 520, orders: 298, stock: "In Stock", rating: "4.9", available: true, photo: "https://images.pexels.com/photos/18133821/pexels-photo-18133821.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Crushed Oreo cookies blended into a thick vanilla shake." },
  { id: "FD-2015", name: "Strawberry Shake", category: "Shakes", price: 480, orders: 187, stock: "In Stock", rating: "4.6", available: true, photo: "https://images.pexels.com/photos/11299733/pexels-photo-11299733.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Fresh strawberry blended shake, sweet and refreshing." },

  // Beverages
  { id: "FD-3018", name: "Mango Lassi", category: "Beverages", price: 350, orders: 267, stock: "In Stock", rating: "4.8", available: true, photo: "https://images.pexels.com/photos/14509267/pexels-photo-14509267.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Traditional yogurt-based mango drink, thick and refreshing." },
  { id: "FD-3019", name: "Soft Drink (Can)", category: "Beverages", price: 120, orders: 421, stock: "In Stock", rating: "4.3", available: true, photo: "https://images.pexels.com/photos/4113656/pexels-photo-4113656.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Chilled soft drink of your choice." },
  { id: "FD-2016", name: "Iced Cola", category: "Beverages", price: 180, orders: 356, stock: "In Stock", rating: "4.3", available: true, photo: "https://images.pexels.com/photos/8879621/pexels-photo-8879621.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Ice-cold cola served in a chilled glass." },

  // Desserts
  { id: "FD-2017", name: "Chocolate Fudge Brownie", category: "Desserts", price: 420, orders: 209, stock: "In Stock", rating: "4.8", available: true, photo: "https://images.pexels.com/photos/25595974/pexels-photo-25595974.jpeg?auto=compress&cs=tinysrgb&w=600", description: "Warm, fudgy chocolate brownie with a gooey center." },
];

// ---------- Orders ----------
export const ORDER_STATUSES = ["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];
const PAYMENT_METHODS = ["Card", "Cash on Delivery", "JazzCash / EasyPaisa"];

export const orders = Array.from({ length: 42 }).map((_, i) => {
  const items = randInt(1, 4);
  const total = Math.round(items * (450 + rand() * 700));
  return {
    id: `#${10300 - i}`,
    customer: pick(NAMES),
    branch: pick(BRANCH_NAMES),
    items,
    amount: total,
    status: pick(ORDER_STATUSES),
    payment: pick(PAYMENT_METHODS),
    date: new Date(2026, 7, randInt(1, 20), randInt(8, 22), randInt(0, 59)),
    address: `House ${randInt(1, 200)}, Street ${randInt(1, 40)}, ${pick(KARACHI_AREAS)}, Karachi`,
  };
});

// ---------- Customers ----------
export const customers = NAMES.map((name, i) => ({
  id: `CUS-${3000 + i}`,
  name,
  email: `${name.toLowerCase().replace(/ /g, ".")}@mail.com`,
  phone: `+92 3${randInt(10, 99)} ${randInt(1000000, 9999999)}`,
  orders: randInt(1, 65),
  spent: Math.round(randInt(1, 65) * (500 + rand() * 400)),
  status: pick(["Active", "Active", "Active", "Inactive"]),
  joined: `${pick(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"])} 202${pick([3, 4, 5])}`,
  location: pick(KARACHI_AREAS),
}));

// ---------- Delivery riders ----------
export const riders = NAMES.slice(0, 12).map((name, i) => ({
  id: `RID-${4000 + i}`,
  name,
  phone: `+92 3${randInt(10, 99)} ${randInt(1000000, 9999999)}`,
  vehicle: pick(["Motorbike", "Motorbike", "Motorbike", "Bicycle"]),
  status: pick(["On Delivery", "Available", "Available", "Offline"]),
  deliveries: randInt(20, 420),
  rating: (3.8 + rand() * 1.2).toFixed(1),
  branch: pick(BRANCH_NAMES),
}));

// ---------- Payments ----------
export const payments = orders.slice(0, 30).map((o, i) => ({
  id: `TXN-${5000 + i}`,
  orderId: o.id,
  customer: o.customer,
  amount: o.amount,
  method: o.payment,
  status: pick(["Completed", "Completed", "Completed", "Pending", "Failed", "Refunded"]),
  date: o.date,
}));

// ---------- Coupons ----------
export const coupons = [
  { id: "CPN-001", code: "SAJJI20", type: "Percentage", value: 20, uses: 340, maxUses: 500, status: "Active", expiry: "2026-09-30", minOrder: 800 },
  { id: "CPN-002", code: "FREEDELIVERY", type: "Free Delivery", value: 0, uses: 890, maxUses: 1000, status: "Active", expiry: "2026-08-31", minOrder: 600 },
  { id: "CPN-003", code: "FLAT150", type: "Fixed", value: 150, uses: 120, maxUses: 200, status: "Active", expiry: "2026-10-15", minOrder: 1200 },
  { id: "CPN-004", code: "SUMMER15", type: "Percentage", value: 15, uses: 500, maxUses: 500, status: "Expired", expiry: "2026-07-01", minOrder: 1000 },
  { id: "CPN-005", code: "NEWUSER10", type: "Percentage", value: 10, uses: 45, maxUses: 1000, status: "Active", expiry: "2026-12-31", minOrder: 400 },
  { id: "CPN-006", code: "WEEKEND25", type: "Percentage", value: 25, uses: 210, maxUses: 300, status: "Paused", expiry: "2026-09-15", minOrder: 1500 },
];

// ---------- Reviews ----------
export const reviews = Array.from({ length: 24 }).map((_, i) => ({
  id: `REV-${6000 + i}`,
  customer: pick(NAMES),
  branch: pick(BRANCH_NAMES),
  rating: randInt(2, 5),
  comment: pick([
    "Smash patty was cooked perfectly, loved the crispy edges!",
    "Delivery took a bit longer than expected.",
    "Best smash burger in Karachi, hands down.",
    "Fries were a little soggy this time.",
    "Packaging was excellent, nothing spilled.",
    "Rider was very polite and quick.",
    "Bun was a bit dry, but the patty was great.",
    "The Oreo shake is unreal, will order again!",
    "Order was missing a side, disappointing.",
    "Great value for money, highly recommend.",
  ]),
  date: new Date(2026, 7, randInt(1, 20)),
  status: pick(["Published", "Published", "Published", "Flagged", "Hidden"]),
  reply: rand() > 0.6 ? "Thanks so much for the feedback — we appreciate it!" : null,
}));

// ---------- Analytics: revenue trend ----------
export const weeklyRevenue = [
  { day: "Mon", revenue: 320000, orders: 120 },
  { day: "Tue", revenue: 410000, orders: 148 },
  { day: "Wed", revenue: 380000, orders: 132 },
  { day: "Thu", revenue: 520000, orders: 176 },
  { day: "Fri", revenue: 610000, orders: 210 },
  { day: "Sat", revenue: 720000, orders: 258 },
  { day: "Sun", revenue: 680000, orders: 241 },
];

export const monthlyRevenue = [
  { day: "Jan", revenue: 4200000, orders: 1450 },
  { day: "Feb", revenue: 3850000, orders: 1320 },
  { day: "Mar", revenue: 5100000, orders: 1680 },
  { day: "Apr", revenue: 4750000, orders: 1590 },
  { day: "May", revenue: 5820000, orders: 1920 },
  { day: "Jun", revenue: 6340000, orders: 2100 },
  { day: "Jul", revenue: 7120000, orders: 2340 },
  { day: "Aug", revenue: 6890000, orders: 2280 },
];

export const categorySales = [
  { name: "Burgers", value: 26, color: "#f97316" },
  { name: "Karahi", value: 16, color: "#ea580c" },
  { name: "BBQ", value: 13, color: "#fb923c" },
  { name: "Pizza", value: 12, color: "#fdba74" },
  { name: "Sides", value: 10, color: "#fed7aa" },
  { name: "Roti & Naan", value: 9, color: "#fecaca" },
  { name: "Other", value: 14, color: "#e5e7eb" },
];

export const branchDistribution = BRANCHES.map((b) => ({ branch: b.area, orders: b.orders }));

// ---------- Vendors (suppliers we purchase ingredients/supplies from) ----------
export const vendorCategories = [
  "Meat & Poultry", "Vegetables & Produce", "Dairy & Eggs", "Spices & Condiments",
  "Bakery & Bread", "Beverages", "Packaging & Disposables", "Cleaning Supplies",
];

export const vendors = [
  { id: "VN-01", name: "Karachi Meat Suppliers", category: "Meat & Poultry", contactPerson: "Rashid Mehmood", phone: "+92 300 1234567", email: "rashid@kms.pk", address: "Meat Market, Lyari, Karachi", status: "Active" },
  { id: "VN-02", name: "Fresh Farm Vegetables", category: "Vegetables & Produce", contactPerson: "Aslam Sabzi", phone: "+92 301 2223344", email: "aslam@freshfarm.pk", address: "Sabzi Mandi, Karachi", status: "Active" },
  { id: "VN-03", name: "Al-Madina Dairy", category: "Dairy & Eggs", contactPerson: "Naveed Iqbal", phone: "+92 302 5556677", email: "naveed@almadinadairy.pk", address: "Landhi, Karachi", status: "Active" },
  { id: "VN-04", name: "Spice Bazaar Traders", category: "Spices & Condiments", contactPerson: "Farhan Qureshi", phone: "+92 303 8889900", email: "farhan@spicebazaar.pk", address: "Jodia Bazaar, Karachi", status: "Active" },
  { id: "VN-05", name: "Karachi Bakers & Co.", category: "Bakery & Bread", contactPerson: "Imran Baig", phone: "+92 304 1112233", email: "imran@karachibakers.pk", address: "Gulshan-e-Iqbal, Karachi", status: "Active" },
  { id: "VN-06", name: "Crystal Beverages", category: "Beverages", contactPerson: "Salman Yousuf", phone: "+92 305 4445566", email: "salman@crystalbev.pk", address: "SITE Area, Karachi", status: "Active" },
  { id: "VN-07", name: "PackPro Disposables", category: "Packaging & Disposables", contactPerson: "Waqas Ahmed", phone: "+92 306 7778899", email: "waqas@packpro.pk", address: "Korangi Industrial Area, Karachi", status: "Active" },
  { id: "VN-08", name: "ShineClean Supplies", category: "Cleaning Supplies", contactPerson: "Tariq Mehmood", phone: "+92 307 3334455", email: "tariq@shineclean.pk", address: "North Karachi, Karachi", status: "Inactive" },
];

// ---------- Inventory (kitchen stock — raw ingredients & supplies, distinct from the sellable food_items menu) ----------
export const inventoryCategories = [
  "Meat & Poultry", "Vegetables & Produce", "Dairy & Eggs", "Spices & Condiments",
  "Bakery & Bread", "Beverages", "Packaging", "Cleaning Supplies", "Rice & Grains",
];

export const inventoryUnits = ["kg", "litre", "packet", "piece", "dozen", "box", "sack"];

export const inventoryItems = [
  { id: "INV-001", name: "Whole Chicken", category: "Meat & Poultry", unit: "kg", currentStock: 85, reorderLevel: 40, costPerUnit: 480, vendor: "Karachi Meat Suppliers", branch: "Areeba Restaurant – Nazimabad", lastRestocked: "2026-09-08" },
  { id: "INV-002", name: "Beef (Boneless)", category: "Meat & Poultry", unit: "kg", currentStock: 32, reorderLevel: 30, costPerUnit: 950, vendor: "Karachi Meat Suppliers", branch: "Areeba Restaurant – Nazimabad", lastRestocked: "2026-09-07" },
  { id: "INV-003", name: "Mutton", category: "Meat & Poultry", unit: "kg", currentStock: 12, reorderLevel: 20, costPerUnit: 1600, vendor: "Karachi Meat Suppliers", branch: "Areeba Restaurant – North Nazimabad", lastRestocked: "2026-09-05" },
  { id: "INV-004", name: "Onions", category: "Vegetables & Produce", unit: "kg", currentStock: 120, reorderLevel: 50, costPerUnit: 90, vendor: "Fresh Farm Vegetables", branch: "Areeba Restaurant – Nazimabad", lastRestocked: "2026-09-09" },
  { id: "INV-005", name: "Tomatoes", category: "Vegetables & Produce", unit: "kg", currentStock: 45, reorderLevel: 40, costPerUnit: 110, vendor: "Fresh Farm Vegetables", branch: "Areeba Restaurant – Nazimabad", lastRestocked: "2026-09-09" },
  { id: "INV-006", name: "Green Chillies", category: "Vegetables & Produce", unit: "kg", currentStock: 8, reorderLevel: 10, costPerUnit: 220, vendor: "Fresh Farm Vegetables", branch: "Areeba Restaurant – North Nazimabad", lastRestocked: "2026-09-06" },
  { id: "INV-007", name: "Potatoes", category: "Vegetables & Produce", unit: "kg", currentStock: 95, reorderLevel: 40, costPerUnit: 70, vendor: "Fresh Farm Vegetables", branch: "Areeba Restaurant – Nazimabad", lastRestocked: "2026-09-08" },
  { id: "INV-008", name: "Cooking Oil", category: "Spices & Condiments", unit: "litre", currentStock: 60, reorderLevel: 30, costPerUnit: 620, vendor: "Spice Bazaar Traders", branch: "Areeba Restaurant – Nazimabad", lastRestocked: "2026-09-04" },
  { id: "INV-009", name: "Garam Masala Mix", category: "Spices & Condiments", unit: "kg", currentStock: 6, reorderLevel: 5, costPerUnit: 1800, vendor: "Spice Bazaar Traders", branch: "Areeba Restaurant – Nazimabad", lastRestocked: "2026-08-30" },
  { id: "INV-010", name: "Red Chilli Powder", category: "Spices & Condiments", unit: "kg", currentStock: 3, reorderLevel: 8, costPerUnit: 950, vendor: "Spice Bazaar Traders", branch: "Areeba Restaurant – North Nazimabad", lastRestocked: "2026-08-28" },
  { id: "INV-011", name: "Cheddar Cheese", category: "Dairy & Eggs", unit: "kg", currentStock: 18, reorderLevel: 15, costPerUnit: 1450, vendor: "Al-Madina Dairy", branch: "Areeba Restaurant – Nazimabad", lastRestocked: "2026-09-07" },
  { id: "INV-012", name: "Yogurt", category: "Dairy & Eggs", unit: "kg", currentStock: 25, reorderLevel: 20, costPerUnit: 280, vendor: "Al-Madina Dairy", branch: "Areeba Restaurant – Nazimabad", lastRestocked: "2026-09-09" },
  { id: "INV-013", name: "Eggs", category: "Dairy & Eggs", unit: "dozen", currentStock: 40, reorderLevel: 20, costPerUnit: 320, vendor: "Al-Madina Dairy", branch: "Areeba Restaurant – North Nazimabad", lastRestocked: "2026-09-08" },
  { id: "INV-014", name: "Burger Buns", category: "Bakery & Bread", unit: "piece", currentStock: 210, reorderLevel: 100, costPerUnit: 35, vendor: "Karachi Bakers & Co.", branch: "Areeba Restaurant – Nazimabad", lastRestocked: "2026-09-09" },
  { id: "INV-015", name: "Naan Flour (Maida)", category: "Bakery & Bread", unit: "sack", currentStock: 4, reorderLevel: 5, costPerUnit: 4200, vendor: "Karachi Bakers & Co.", branch: "Areeba Restaurant – North Nazimabad", lastRestocked: "2026-08-29" },
  { id: "INV-016", name: "Soft Drink Cans", category: "Beverages", unit: "box", currentStock: 22, reorderLevel: 15, costPerUnit: 1800, vendor: "Crystal Beverages", branch: "Areeba Restaurant – Nazimabad", lastRestocked: "2026-09-06" },
  { id: "INV-017", name: "Disposable Containers", category: "Packaging", unit: "packet", currentStock: 55, reorderLevel: 30, costPerUnit: 850, vendor: "PackPro Disposables", branch: "Areeba Restaurant – Nazimabad", lastRestocked: "2026-09-03" },
  { id: "INV-018", name: "Paper Bags", category: "Packaging", unit: "packet", currentStock: 9, reorderLevel: 20, costPerUnit: 450, vendor: "PackPro Disposables", branch: "Areeba Restaurant – North Nazimabad", lastRestocked: "2026-08-25" },
  { id: "INV-019", name: "Dishwashing Liquid", category: "Cleaning Supplies", unit: "litre", currentStock: 14, reorderLevel: 10, costPerUnit: 380, vendor: "ShineClean Supplies", branch: "Areeba Restaurant – Nazimabad", lastRestocked: "2026-08-27" },
  { id: "INV-020", name: "Basmati Rice", category: "Rice & Grains", unit: "sack", currentStock: 0, reorderLevel: 3, costPerUnit: 8500, vendor: "Fresh Farm Vegetables", branch: "Areeba Restaurant – North Nazimabad", lastRestocked: "2026-08-15" },
];

export function getStockStatus(item) {
  if (item.currentStock <= 0) return "Out of Stock";
  if (item.currentStock <= item.reorderLevel) return "Low Stock";
  return "In Stock";
}

export function formatDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatTime(date) {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
