import BrandLogo from "../../components/BrandLogo";
import Reveal from "./Reveal";

function SiteFooter() {
  return (
    <>
      {/* White-on-orange CTA band for extra brand punch before the footer */}
      <div className="relative overflow-hidden bg-[#E8491D] px-5 py-12 text-center sm:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-blob-drift absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="animate-blob-drift absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" style={{ animationDelay: "-5s" }} />
        </div>
        <Reveal className="relative">
          <h3 className="font-[Anton] text-2xl tracking-wide text-white sm:text-3xl">
            HUNGRY YET? THE GRILL'S ALREADY HOT.
          </h3>
          <button
            onClick={() => document.querySelector("#menu")?.scrollIntoView({ behavior: "smooth" })}
            className="btn-shine mt-5 rounded-md bg-white px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#E8491D] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Order Now
          </button>
        </Reveal>
      </div>

      <footer id="contact" className="bg-[#FBF8F4] px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2.5">
                <BrandLogo size={36} />
                <span className="font-[Anton] text-lg tracking-wide text-[#1C1410]">
                  AREEBA <span className="text-[#E8491D]">RESTAURANT</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-black/50">
                Karachi's home for whole-roasted sajji, live BBQ, and desi favourites —
                serving char-grilled classics and mandi platters since 2022.
              </p>
              <div className="mt-5 flex gap-3">
                <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-md bg-black/5 text-xs font-bold text-black/55 transition hover:-translate-y-0.5 hover:bg-[#E8491D] hover:text-white">
                  IG
                </a>
                <a href="#" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-md bg-black/5 text-xs font-bold text-black/55 transition hover:-translate-y-0.5 hover:bg-[#E8491D] hover:text-white">
                  FB
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-black/35">Quick Links</h4>
              <div className="mt-4 flex flex-col gap-2.5 text-sm text-black/60">
                <a href="#menu" className="w-fit transition hover:translate-x-1 hover:text-[#1C1410]">Full Menu</a>
                <a href="#locations" className="w-fit transition hover:translate-x-1 hover:text-[#1C1410]">Branch Locations</a>
                <a href="/admin/dashboard" className="w-fit transition hover:translate-x-1 hover:text-[#1C1410]">Staff Login</a>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-black/35">Get In Touch</h4>
              <div className="mt-4 flex flex-col gap-2.5 text-sm text-black/60">
                <a href="tel:+923342795293" className="w-fit transition hover:translate-x-1 hover:text-[#1C1410]">+92 334 2795293</a>
                <a href="mailto:hello@areebarestaurant.pk" className="w-fit transition hover:translate-x-1 hover:text-[#1C1410]">hello@areebarestaurant.pk</a>
                <span>6:00 PM – 3:00 AM, Daily</span>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-black/10 pt-6 text-xs text-black/35">
            © {new Date().getFullYear()} Areeba Restaurant. All rights reserved. Karachi, Pakistan.
          </div>
        </div>
      </footer>
    </>
  );
}

export default SiteFooter;
