import SiteHeader from "./components/SiteHeader";
import Hero from "./components/Hero";
import MenuSection from "./components/MenuSection";
import LocationsSection from "./components/LocationsSection";
import SiteFooter from "./components/SiteFooter";
import CartDrawer from "./components/CartDrawer";

function PublicSite() {
  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <SiteHeader />
      <Hero />
      <MenuSection />
      <LocationsSection />
      <SiteFooter />
      <CartDrawer />
    </div>
  );
}

export default PublicSite;
