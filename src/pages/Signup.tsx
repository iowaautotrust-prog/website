import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, User, Check, X, CheckCircle2 } from "lucide-react";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

type PasswordStrength = "weak" | "fair" | "strong";

function getPasswordStrength(pw: string): PasswordStrength {
  const hasLength = pw.length >= 8;
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const passed = [hasLength, hasUpper, hasNumber].filter(Boolean).length;
  if (passed === 3) return "strong";
  if (passed === 2) return "fair";
  return "weak";
}

const strengthConfig: Record<PasswordStrength, { label: string; color: string; bars: number }> = {
  weak:   { label: "Weak",   color: "bg-red-500",    bars: 1 },
  fair:   { label: "Fair",   color: "bg-yellow-400", bars: 2 },
  strong: { label: "Strong", color: "bg-green-500",  bars: 3 },
};

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const { signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const { label: strengthLabel, color: strengthColor, bars: strengthBars } = strengthConfig[strength];
  const passwordsMatch = confirmPassword === "" || password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (strength !== "strong") {
      setError("Password does not meet the requirements. Please choose a stronger password.");
      setPasswordTouched(true);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const timeout = setTimeout(() => {
      setLoading(false);
      setError("Request timed out. Please try again.");
    }, 15000);
    const result = await signup(name, email, password);
    clearTimeout(timeout);
    setLoading(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate("/"), 1500);
    } else {
      setError(result.error || "Signup failed. Please try again.");
    }
  };

  const handleGoogle = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setGoogleLoading(false);
    }
  };

  if (checkEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center section-padding">
        <div className="text-center max-w-md space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-muted-foreground">
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{email}</span>.
            Click the link to activate your account.
          </p>
          <Link to="/login" className="btn-hero inline-block mt-4">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (success) return (
    <div className="min-h-screen bg-background flex items-center justify-center section-padding">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Account created!</h2>
        <p className="text-muted-foreground">Welcome to Iowa Auto Trust. Redirecting you now…</p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center section-padding">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-primary mb-3">
            Iowa Auto Trust
          </p>
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground text-sm">
            Save your favorite vehicles and get personalized recommendations.
          </p>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Google OAuth */}
        <Button
          type="button"
          variant="outline"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 h-11 mb-5"
        >
          <GoogleIcon />
          {googleLoading ? "Redirecting…" : "Sign up with Google"}
        </Button>

        <div className="relative flex items-center gap-3 mb-5">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-muted-foreground">or sign up with email</span>
          <div className="flex-1 border-t border-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordTouched(true);
                }}
                placeholder="Min. 8 characters"
                required
                className="pl-10"
              />
            </div>

            {/* Strength bar */}
            {passwordTouched && password.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex gap-1 h-1.5">
                  {[1, 2, 3].map((bar) => (
                    <div
                      key={bar}
                      className={`flex-1 rounded-full transition-colors duration-200 ${
                        bar <= strengthBars ? strengthColor : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${
                  strength === "weak" ? "text-red-500" :
                  strength === "fair" ? "text-yellow-500" :
                  "text-green-600"
                }`}>
                  {strengthLabel}
                </p>

                {/* Requirements checklist */}
                <ul className="space-y-1">
                  {[
                    { met: hasLength, label: "8+ characters" },
                    { met: hasUpper,  label: "One uppercase letter" },
                    { met: hasNumber, label: "One number" },
                  ].map(({ met, label }) => (
                    <li key={label} className={`flex items-center gap-1.5 text-xs ${met ? "text-green-600" : "text-muted-foreground"}`}>
                      {met
                        ? <Check className="w-3 h-3 text-green-600" />
                        : <X className="w-3 h-3 text-muted-foreground/50" />
                      }
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                className={`pl-10 ${
                  confirmPassword.length > 0 && !passwordsMatch
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }`}
              />
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-red-500">Passwords do not match.</p>
            )}
          </div>

          <Button type="submit" disabled={loading} className="btn-hero w-full">
            {loading ? "Creating Account…" : "Create Account"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
