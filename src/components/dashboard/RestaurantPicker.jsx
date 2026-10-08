import Select from "../ui/Select";

/** Branch switcher shown on pages that act on one restaurant at a time (menu, coupons). */
function RestaurantPicker({ restaurants, value, onChange, className = "w-72" }) {
  if (!restaurants || restaurants.length < 2) return null;
  return (
    <Select
      value={value || ""}
      onChange={onChange}
      className={className}
      options={restaurants.map((r) => ({ value: r.id, label: r.name }))}
    />
  );
}

export default RestaurantPicker;
