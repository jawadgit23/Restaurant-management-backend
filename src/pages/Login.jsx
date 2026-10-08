import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";

import BrandLogo from "../components/BrandLogo";
import { useAuth } from "../context/AuthContext";
import { isBackendConfigured } from "../lib/apiClient";
import BackendSetupNotice from "../components/auth/BackendSetupNotice";
import Button from "../components/ui/Button";
import Field, { inputClass } from "../components/ui/Field";

function Login() {
  const { signIn, isStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/admin/dashboard";

  if (isStaff) {
    navigate(redirectTo, { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isBackendConfigured) {
      setError("The backend is not configured yet — see the setup notice below.");
      return;
    }

    setSubmitting(true);
    const { error: signInError } = await signIn(email.trim(), password, { staffOnly: true });
    setSubmitting(false);

    if (signInError) {
      setError(signInError.message || "Invalid email or password.");
      return;
    }
    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo size={56} animated />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Areeba<span className="text-orange-600"> Restaurant</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">Admin Panel · Karachi</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-zinc-100">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Enter your admin credentials to access the dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Email">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@areebarestaurant.pk"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pl-9 pr-9`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              <LogIn size={16} /> {submitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        {!isBackendConfigured && <BackendSetupNotice className="mt-5" />}
      </div>
    </div>
  );
}

export default Login;
