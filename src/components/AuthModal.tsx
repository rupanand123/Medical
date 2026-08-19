import React, { useState } from "react";
import { User, Mail, Lock, UserCheck, Shield, Sparkles, X, ArrowRight, AlertCircle, Heart } from "lucide-react";
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from "../firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onDemoSignIn: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess, onDemoSignIn }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"caregiver" | "elderly">("caregiver");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!email.trim() || !password.trim()) {
          throw new Error("Email and password are required.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        await signUpWithEmail(email.trim(), password, name.trim(), role);
      } else {
        if (!email.trim() || !password.trim()) {
          throw new Error("Email and password are required.");
        }
        await signInWithEmail(email.trim(), password);
      }
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      console.error("Auth error:", err);
      let msg = err.message || "An authentication error occurred.";
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        msg = "Invalid email or password. Please check your credentials and try again.";
      } else if (err.code === "auth/user-not-found") {
        msg = "No account found with this email. Please register for a new account.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email address already exists. Please sign in instead.";
      } else if (err.code === "auth/invalid-email") {
        msg = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      }
      setError(msg);
    }
  };

  const handleGoogleClick = async () => {
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      setLoading(false);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setLoading(false);
      if (err?.code === "auth/unauthorized-domain" || String(err).includes("unauthorized-domain")) {
        const domainName = typeof window !== "undefined" ? window.location.hostname : "current domain";
        setNotice(
          `Notice: Google Sign-In popups require adding "${domainName}" to Authorized Domains in Firebase Console (Authentication -> Settings -> Authorized Domains). You can sign up with Email & Password or click Quick Demo Account Login below!`
        );
      } else {
        setError(err?.message || "Google Sign-In failed. Please try again.");
      }
    }
  };

  const handleDemoClick = () => {
    onDemoSignIn();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-emerald-100 overflow-hidden relative flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 sm:p-7 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md">
              <Heart className="w-6 h-6 text-white fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                CareConnect
                <span className="text-[10px] bg-white/20 text-white font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Health
                </span>
              </h2>
              <p className="text-xs text-emerald-100 font-medium">Caregiver & Older Adult Portal</p>
            </div>
          </div>
          <p className="text-xs text-emerald-50/90 mt-2 font-medium">
            {mode === "signin" ? "Sign in to access synchronized medications & safety logs" : "Create an account for Caregiver or Older Adult"}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 font-semibold flex items-start gap-2.5 shadow-2xs">
              <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {notice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-medium flex items-start gap-2.5 shadow-2xs">
              <Sparkles className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{notice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Smith or Arthur Pendelton"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Account Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("caregiver")}
                      className={`p-2.5 rounded-full border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs ${
                        role === "caregiver"
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Caregiver
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("elderly")}
                      className={`p-2.5 rounded-full border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs ${
                        role === "elderly"
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>👴</span>
                      Older Adult
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-emerald-600/25 disabled:opacity-50 mt-3"
            >
              {loading ? "Processing..." : mode === "signin" ? "Sign In with Email" : "Create Account"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full"></div>
            <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider absolute">or continue with</span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-full text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign In with Google
            </button>

            <button
              type="button"
              onClick={handleDemoClick}
              className="w-full py-2.5 bg-emerald-50/80 hover:bg-emerald-100/90 border border-emerald-200 text-emerald-900 rounded-full text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Quick Demo Account Login
            </button>
          </div>

          {/* Toggle between Sign In / Sign Up */}
          <div className="text-center pt-3 border-t border-slate-100">
            {mode === "signin" ? (
              <p className="text-xs text-slate-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setNotice(null);
                  }}
                  className="font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer ml-1"
                >
                  Register new account
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-600">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                    setNotice(null);
                  }}
                  className="font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer ml-1"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
