import { Clock, MapPin, Phone, Star } from "lucide-react";
import Reveal from "./Reveal";
import { useRestaurant } from "../context/RestaurantContext";

function LocationsSection() {
  const { restaurants: BRANCHES } = useRestaurant();
  return (
    <section id="locations" className="bg-[#FFFFFF] px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="text-sm font-bold uppercase tracking-widest text-[#E8491D]">Find Us</p>
          <h2 className="mt-2 font-[Anton] text-4xl tracking-wide text-[#1C1410] sm:text-5xl">
            FIND US. SAME FIRE.
          </h2>
          <p className="mt-3 max-w-xl text-sm text-black/55 sm:text-base">
            Walk in, call ahead, or order for delivery — every branch fires up the grill for you.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {BRANCHES.map((b, i) => {
            const headerBg = i % 2 === 0 ? "#E8491D" : "#1FA34A";
            return (
              <Reveal key={b.id} index={i}>
                <div className="group h-full overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-[#E8491D]/30 hover:shadow-xl hover:shadow-[#E8491D]/10">
                  <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: headerBg }}>
                    <h3 className="font-[Anton] text-base tracking-wide text-white">{b.area.toUpperCase()}</h3>
                    <span className="flex items-center gap-1 text-xs font-bold text-white">
                      <Star size={12} className="fill-white" /> {b.rating}
                    </span>
                  </div>
                  <div className="space-y-3 p-5">
                    <div className="flex items-start gap-2.5 text-sm text-black/65">
                      <MapPin size={15} className="mt-0.5 shrink-0 text-[#E8491D] transition-transform duration-300 group-hover:-translate-y-0.5" />
                      {b.address}
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-black/65">
                      <Phone size={15} className="shrink-0 text-[#E8491D]" />
                      {b.phone}
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-black/65">
                      <Clock size={15} className="shrink-0 text-[#E8491D]" />
                      6:00 PM – 3:00 AM, Daily
                    </div>
                  </div>
                  <a
                    href={`tel:${b.phone.replace(/\s/g, "")}`}
                    className="block border-t border-black/5 px-5 py-3 text-center text-sm font-bold text-[#E8491D] transition hover:bg-[#E8491D]/5"
                  >
                    Call This Branch
                  </a>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default LocationsSection;
