import { vendors as seed } from "../../data/mockData";
import { createLocalCollection } from "../localCollection";

const store = createLocalCollection("areeba_vendors", seed, "VN");

export const listVendors = () => store.list();
export const createVendor = (vendor) => store.create(vendor);
export const updateVendor = (id, updates) => store.update(id, updates);
export const deleteVendor = (id) => store.remove(id);
