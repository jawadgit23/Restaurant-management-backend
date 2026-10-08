import { useState } from "react";
import { User, Bell, Shield, Palette, Store, Save, Moon, Sun, Camera } from "lucide-react";

import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Field, { inputClass } from "../components/ui/Field";
import Select from "../components/ui/Select";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "store", label: "Store", icon: Store },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: Shield },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-orange-600" : "bg-gray-300 dark:bg-zinc-700"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [tab, setTab] = useState("profile");

  const [profile, setProfile] = useState({
    name: "Jawad Zaman",
    email: "admin@areebarestaurant.pk",
    phone: "+92 300 1234567",
    role: "Administrator",
  });

  const [store, setStore] = useState({
    storeName: "Areeba Restaurant",
    currency: "PKR",
    taxRate: 5,
    timezone: "Asia/Karachi",
  });

  const [notifications, setNotifications] = useState({
    newOrders: true,
    orderUpdates: true,
    payouts: true,
    reviews: false,
    marketing: false,
    weeklyReport: true,
  });

  const [security, setSecurity] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const saveProfile = (e) => {
    e.preventDefault();
    toast("Profile updated", { description: "Your changes have been saved." });
  };

  const saveStore = (e) => {
    e.preventDefault();
    toast("Store settings updated", { description: "Changes will reflect across the platform." });
  };

  const savePassword = (e) => {
    e.preventDefault();
    if (!security.currentPassword || !security.newPassword) {
      toast("Please fill in all password fields", { type: "error" });
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      toast("Passwords do not match", { type: "error" });
      return;
    }
    setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    toast("Password changed", { description: "Use your new password next time you sign in." });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader title="Settings" subtitle="Manage your account, store, and preferences." />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition lg:w-full ${
                  tab === t.id
                    ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        <div>
          {tab === "profile" && (
            <Card>
              <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Profile Information</h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-zinc-400">Update your personal details.</p>

              <div className="mb-6 flex items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-lg font-semibold text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                  JZ
                  <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-500 shadow ring-1 ring-gray-200 dark:bg-zinc-800 dark:ring-zinc-700">
                    <Camera size={12} />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{profile.name}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{profile.role}</p>
                </div>
              </div>

              <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name">
                  <input className={inputClass} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </Field>
                <Field label="Email Address">
                  <input type="email" className={inputClass} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </Field>
                <Field label="Phone Number">
                  <input className={inputClass} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </Field>
                <Field label="Role">
                  <input className={inputClass} value={profile.role} disabled />
                </Field>
                <div className="sm:col-span-2">
                  <Button type="submit">
                    <Save size={15} /> Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {tab === "store" && (
            <Card>
              <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Store Configuration</h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-zinc-400">General settings for your marketplace.</p>

              <form onSubmit={saveStore} className="grid gap-4 sm:grid-cols-2">
                <Field label="Business Name">
                  <input className={inputClass} value={store.storeName} onChange={(e) => setStore({ ...store, storeName: e.target.value })} />
                </Field>
                <Field label="Currency">
                  <Select
                    value={store.currency}
                    onChange={(v) => setStore({ ...store, currency: v })}
                    options={[
                      { value: "PKR", label: "PKR (Rs)" },
                      { value: "USD", label: "USD ($)" },
                      { value: "AED", label: "AED (د.إ)" },
                      { value: "GBP", label: "GBP (£)" },
                    ]}
                  />
                </Field>
                <Field label="Sales Tax Rate (%)">
                  <input
                    type="number"
                    className={inputClass}
                    value={store.taxRate}
                    onChange={(e) => setStore({ ...store, taxRate: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Timezone">
                  <Select
                    value={store.timezone}
                    onChange={(v) => setStore({ ...store, timezone: v })}
                    options={[
                      { value: "Asia/Karachi", label: "Asia/Karachi (PKT)" },
                      { value: "America/New_York", label: "America/New York (ET)" },
                      { value: "Europe/London", label: "Europe/London (GMT)" },
                      { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
                    ]}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Button type="submit">
                    <Save size={15} /> Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {tab === "notifications" && (
            <Card>
              <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Notification Preferences</h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-zinc-400">Choose what you want to be notified about.</p>

              <div className="divide-y divide-slate-200 dark:divide-zinc-800">
                {[
                  { key: "newOrders", label: "New Orders", desc: "Get notified when a new order is placed" },
                  { key: "orderUpdates", label: "Order Status Updates", desc: "Changes to order status and delivery" },
                  { key: "payouts", label: "Payouts", desc: "Payment and payout confirmations" },
                  { key: "reviews", label: "New Reviews", desc: "When customers leave a review" },
                  { key: "marketing", label: "Marketing Updates", desc: "Product news and platform updates" },
                  { key: "weeklyReport", label: "Weekly Summary Report", desc: "A digest of performance every Monday" },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{n.label}</p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">{n.desc}</p>
                    </div>
                    <Toggle
                      checked={notifications[n.key]}
                      onChange={(val) => {
                        setNotifications((prev) => ({ ...prev, [n.key]: val }));
                        toast(`${n.label} ${val ? "enabled" : "disabled"}`, { type: "info", duration: 1800 });
                      }}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === "appearance" && (
            <Card>
              <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Appearance</h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-zinc-400">Customize how the dashboard looks.</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => theme === "dark" && toggleTheme()}
                  className={`rounded-lg border-2 p-4 text-left transition ${
                    theme === "light" ? "border-orange-600" : "border-slate-300 dark:border-zinc-700"
                  }`}
                >
                  <div className="mb-3 flex h-16 items-center justify-center rounded-lg bg-slate-50 border border-slate-300">
                    <Sun size={22} className="text-orange-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">Light Mode</p>
                </button>

                <button
                  onClick={() => theme === "light" && toggleTheme()}
                  className={`rounded-lg border-2 p-4 text-left transition ${
                    theme === "dark" ? "border-orange-600" : "border-slate-300 dark:border-zinc-700"
                  }`}
                >
                  <div className="mb-3 flex h-16 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700">
                    <Moon size={22} className="text-orange-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">Dark Mode</p>
                </button>
              </div>
            </Card>
          )}

          {tab === "security" && (
            <Card>
              <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">Change Password</h2>
              <p className="mb-6 text-sm text-slate-500 dark:text-zinc-400">Choose a strong password you don't use elsewhere.</p>

              <form onSubmit={savePassword} className="max-w-md space-y-4">
                <Field label="Current Password" required>
                  <input
                    type="password"
                    className={inputClass}
                    value={security.currentPassword}
                    onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                  />
                </Field>
                <Field label="New Password" required>
                  <input
                    type="password"
                    className={inputClass}
                    value={security.newPassword}
                    onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                  />
                </Field>
                <Field label="Confirm New Password" required>
                  <input
                    type="password"
                    className={inputClass}
                    value={security.confirmPassword}
                    onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                  />
                </Field>
                <Button type="submit">
                  <Shield size={15} /> Update Password
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
