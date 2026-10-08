import { Routes, Route, Navigate } from "react-router-dom";

import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./site/context/CartContext";
import { RestaurantProvider } from "./site/context/RestaurantContext";

import AdminLayout from "./layouts/AdminLayout";
import POSLayout from "./layouts/POSLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Orders from "./pages/Orders";
import Branches from "./pages/Branches";
import FoodMenu from "./pages/FoodMenu";
import Vendors from "./pages/Vendors";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import Delivery from "./pages/Delivery";
import Payments from "./pages/Payments";
import Coupons from "./pages/Coupons";
import Reviews from "./pages/Reviews";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

import PublicSite from "./site/PublicSite";

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <RestaurantProvider>
            <Routes>
              {/* Public customer-facing menu website */}
              <Route path="/" element={<PublicSite />} />

              {/* Admin login */}
              <Route path="/admin/login" element={<Login />} />

              {/* POS terminal — deliberately outside AdminLayout so it gets
                  the full page width instead of the dashboard sidebar's
                  256px cutting into it. */}
              <Route
                path="/admin/pos"
                element={
                  <ProtectedRoute>
                    <POSLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<POS />} />
              </Route>

              {/* Admin dashboard (auth-protected) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="branches" element={<Branches />} />
                <Route path="food" element={<FoodMenu />} />
                <Route path="vendors" element={<Vendors />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="customers" element={<Customers />} />
                <Route path="delivery" element={<Delivery />} />
                <Route path="payments" element={<Payments />} />
                <Route path="coupons" element={<Coupons />} />
                <Route path="reviews" element={<Reviews />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
            </RestaurantProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
