import { inventoryItems as seed } from "../../data/mockData";
import { createLocalCollection } from "../localCollection";

const store = createLocalCollection("areeba_inventory", seed, "INV");

export const listInventoryItems = () => store.list();
export const createInventoryItem = (item) => store.create(item);
export const updateInventoryItem = (id, updates) => store.update(id, updates);
export const deleteInventoryItem = (id) => store.remove(id);
