'use client'
export const dynamic = 'force-dynamic';

import { Suspense, useState, useEffect } from "react";
import Head from "next/head";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Sparkles, Mail, User, Lock, Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, CheckCircle2, Crown, Shield, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PhoneInput from "@/components/ui/phone-input";
import { logger } from "@/lib/logger";
import Image from "next/image";

function JsonLd() {
  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "DharmaSaathi",
            "url": "https://dharmasaathi.com/",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://dharmasaathi.com/?q={search_term_string}",
              "query-input": "required name=search_term_string"
            },
            "description": "India's #1 spiritual matrimony and matchmaking platform. Find your soulmate, dharma partner, or Sanatan marriage match. Trusted alternative to Shaadi.com, BharatMatrimony, and more.",
            "sameAs": [
              "https://www.facebook.com/dharmasaathi",
              "https://twitter.com/dharmasaathi",
              "https://www.instagram.com/dharmasaathi/"
            ]
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "DharmaSaathi",
            "url": "https://dharmasaathi.com/",
            "logo": "https://dharmasaathi.com/logo.png",
            "sameAs": [
              "https://www.facebook.com/dharmasaathi",
              "https://twitter.com/dharmasaathi",
              "https://www.instagram.com/dharmasaathi/"
            ]
          })
        }}
      />
    </Head>
  );
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
}

interface FormErrors {
  [key: string]: string | undefined;
}

function LandingSlider({ onCreate, onLogin }: { onCreate: () => void; onLogin: () => void; }) {
  const slides = [
    {
      icon: Crown,
      title: "Premium Matches",
      desc: "High-quality, curated profiles for serious relationships",
      bullets: ["Verified profiles", "Priority visibility", "Exclusive perks"],
      gradient: "from-amber-400 via-yellow-500 to-orange-500",
      bgGlow: "bg-amber-500/20",
    },
    {
      icon: Shield,
      title: "Safe & Secure",
      desc: "Privacy-first experience with community moderation",
      bullets: ["Profile verification", "Report & block", "Clear guidelines"],
      gradient: "from-emerald-400 via-teal-500 to-cyan-500",
      bgGlow: "bg-emerald-500/20",
    },
    {
      icon: Heart,
      title: "Made for Dharma",
      desc: "Find your spiritual life partner with aligned values",
      bullets: ["Values aligned", "Community-first", "Modern experience"],
      gradient: "from-rose-400 via-pink-500 to-purple-500",
      bgGlow: "bg-rose-500/20",
    },
  ];

  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-rose-100 to-rose-200 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent pointer-events-none"></div>

      <div className="w-full px-6 pt-16 pb-6 relative z-10">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <Image
              src="/logo.png"
              alt="DharmaSaathi Logo"
              width={140}
              height={140}
              className="mx-auto block relative z-10 drop-shadow-2xl"
              priority
            />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 bg-clip-text text-transparent">
              India's #1 Spiritual Matrimony
            </h1>
            <p className="text-sm text-gray-600 font-medium">Find Your Divine Life Partner</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 pb-32 relative z-10">
        <div className="max-w-sm mx-auto">
          <div className="bg-white/95 backdrop-blur rounded-2xl border border-rose-100 shadow-md p-8 min-h-[320px]">
            {slides.map((s, i) => (
              <div key={i} className={`${i === index ? 'block' : 'hidden'}`}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-4">
                    <s.icon className="w-7 h-7 text-[#8b0000]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">{s.title}</h3>
                  <p className="text-sm text-gray-600 mb-5 leading-relaxed">{s.desc}</p>
                  <div className="w-full max-w-xs mx-auto space-y-2 text-left">
                    {s.bullets.map((b, bi) => (
                      <div key={bi} className="flex items-center gap-2 text-gray-800">
                        <CheckCircle2 className="w-4 h-4 text-[#8b0000]" />
                        <span className="text-sm font-medium">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-5 flex items-center justify-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-200 ${i === index ? 'w-6 bg-[#8b0000]' : 'w-2 bg-rose-300 hover:bg-rose-400'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-6 bg-gradient-to-t from-white via-rose-50/95 to-transparent backdrop-blur-sm z-20">
        <div className="max-w-sm mx-auto grid grid-cols-1 gap-3">
          <button
            onClick={onCreate}
            className="w-full rounded-full bg-[#8b0000] hover:bg-[#7a0000] text-white font-semibold py-4 text-base shadow-md hover:shadow-lg transition"
          >
            Create new account
          </button>
          <button
            onClick={onLogin}
            className="w-full rounded-full bg-rose-50 text-[#8b0000] border border-rose-200 hover:bg-rose-100 font-semibold py-4 text-base shadow-sm hover:shadow transition"
          >
            Log in to existing account
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileAuthPage({ initialMode = "signup", onBack }: { initialMode?: "signup" | "login"; onBack?: () => void }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [form, setForm] = useState<FormState>({ firstName: "", lastName: "", email: "", mobile: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetJustSent, setResetJustSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (resetJustSent) {
      const t = setTimeout(() => setResetJustSent(false), 2000);
      return () => clearTimeout(t);
    }
  }, [resetJustSent]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setGeneralError(null);
  };

  const validate = () => {
    const err: FormErrors = {};
    if (mode === "signup") {
      if (!form.firstName.trim()) err.firstName = "First name required";
      if (!form.lastName.trim()) err.lastName = "Last name required";
    }
    if (!form.email.trim()) err.email = "Email required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Invalid email";
    if (mode === "signup") {
      if (!form.mobile.trim()) err.mobile = "Mobile required";
    }
    if (!form.password) err.password = "Password required";
    else if (form.password.length < 8) err.password = "At least 8 characters";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setGeneralError(null);
    try {
      if (mode === "signup") {
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            'signupData',
            JSON.stringify({
              email: form.email,
              first_name: form.firstName,
              last_name: form.lastName,
              full_name: `${form.firstName} ${form.lastName}`,
              mobileNumber: form.mobile,
              gender: null,
              birthdate: null,
              referral_code: referralCode || null,
            })
          );
        }

        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              first_name: form.firstName,
              last_name: form.lastName,
              full_name: `${form.firstName} ${form.lastName}`,
              phone: form.mobile,
            },
          },
        });
        if (error) throw error;
        if (data.user) {
          const { error: profileError } = await supabase
            .from('users')
            .upsert(
              {
                id: data.user.id,
                email: form.email,
                first_name: form.firstName,
                last_name: form.lastName,
                full_name: `${form.firstName} ${form.lastName}`,
                phone: form.mobile,
                is_onboarded: false,
              },
              { onConflict: 'id', ignoreDuplicates: true }
            )
            .single()

          if (profileError) {
            logger.error('Profile creation error:', profileError)
          }
          router.push(`/auth-loading?userId=${data.user.id}&isNew=true`);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (err: any) {
      setGeneralError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSent(false);
    setResetJustSent(false);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        resetEmail,
        { redirectTo: 'https://dharmasaathi.com/reset-password' }
      );
      if (error) throw error;
      setResetSent(true);
      setResetJustSent(true);
    } catch (err: any) {
      setResetError(err.message || "Could not send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-gradient-to-br from-rose-50 via-rose-100 to-rose-200">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent pointer-events-none"></div>
      {/* Header with Logo */}
      <div className="w-full px-6 pt-16 pb-6 relative z-10">
        {onBack && (
          <button
            onClick={onBack}
            className="absolute left-4 top-12 p-2 rounded-full bg-white/70 backdrop-blur border border-gray-200 text-gray-700 hover:text-[#8b0000] transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex flex-col items-center space-y-4">
          <Image
            src="/logo.png"
            alt="DharmaSaathi Logo"
            width={140}
            height={140}
            className="mx-auto block"
            priority
          />
          <div className="text-center space-y-1">
            <p className="text-lg text-gray-800 font-semibold">
              India's #1 Spiritual Matrimony
            </p>
            <p className="text-sm text-gray-500 font-medium">
              Find Your Divine Life Partner
            </p>
          </div>
        </div>
      </div>

      {/* Main Auth Container */}
      <div className="flex-1 px-6 pb-8 relative z-10">
        <div className="max-w-sm mx-auto">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Tab Switcher */}
            <div className="flex bg-gray-50">
              <button
                onClick={() => {
                  setMode("signup");
                  setShowForgot(false);
                  setGeneralError(null);
                }}
                className={`flex-1 py-4 px-4 text-sm font-semibold transition-all duration-200 ${
                  mode === "signup" && !showForgot
                    ? "bg-[#8b0000] text-white"
                    : "text-gray-600 hover:text-[#8b0000]"
                } ${mode === "signup" && !showForgot ? "rounded-tl-3xl" : ""}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Sign Up
                </div>
              </button>
              <button
                onClick={() => {
                  setMode("login");
                  setShowForgot(false);
                  setGeneralError(null);
                }}
                className={`flex-1 py-4 px-4 text-sm font-semibold transition-all duration-200 ${
                  mode === "login" && !showForgot
                    ? "bg-[#8b0000] text-white"
                    : "text-gray-600 hover:text-[#8b0000]"
                } ${mode === "login" && !showForgot ? "rounded-tr-3xl" : ""}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4" />
                  Sign In
                </div>
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6">
              {generalError && !showForgot && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-700 text-sm font-medium">{generalError}</p>
                </div>
              )}

              {/* Forgot Password Flow */}
              {showForgot ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Reset Password</h2>
                    <p className="text-gray-600 text-sm">Enter your email to receive a reset link</p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <Label htmlFor="reset-email" className="text-gray-700 font-semibold text-sm mb-1 block">
                        Email Address
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="reset-email"
                          type="email"
                          value={resetEmail}
                          onChange={e => setResetEmail(e.target.value)}
                          className="pl-10 py-3 text-base rounded-xl border border-gray-300 focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] transition-colors"
                          placeholder="you@email.com"
                          disabled={loading}
                        />
                      </div>
                      {resetError && <p className="text-xs text-red-600 mt-1">{resetError}</p>}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || resetJustSent}
                      className={`w-full font-semibold py-3 text-base transition-all duration-200 rounded-xl flex items-center justify-center gap-2 ${
                        resetJustSent 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-[#8b0000] hover:bg-red-700 text-white'
                      }`}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : resetJustSent ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Email Sent!
                        </>
                      ) : (
                        <>
                          Send Reset Link
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full py-3 text-sm text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors rounded-xl"
                      onClick={() => {
                        setShowForgot(false);
                        setResetEmail("");
                        setResetError(null);
                        setResetSent(false);
                      }}
                    >
                      ← Back to Sign In
                    </Button>

                    {resetJustSent && (
                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <p className="text-sm text-green-700 font-medium">
                          Check your inbox (and spam folder) for the reset link
                        </p>
                      </div>
                    )}
                  </form>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {mode === "signup" ? "Create Account" : "Welcome Back"}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {mode === "signup" 
                        ? "Join thousands finding their soulmate" 
                        : "Continue your journey"
                      }
                    </p>
                  </div>

                  {mode === "signup" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="firstName" className="text-gray-700 font-semibold text-sm mb-1 block">
                          First Name
                        </Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                          <Input
                            id="firstName"
                            type="text"
                            value={form.firstName}
                            onChange={e => handleChange("firstName", e.target.value)}
                            className={`pl-10 py-3 text-base rounded-xl border transition-colors ${
                              errors.firstName ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
                            }`}
                            placeholder="First name"
                            disabled={loading}
                          />
                        </div>
                        {errors.firstName && <p className="mt-1 text-xs text-red-600 font-medium">{errors.firstName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-gray-700 font-semibold text-sm mb-1 block">
                          Last Name
                        </Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                          <Input
                            id="lastName"
                            type="text"
                            value={form.lastName}
                            onChange={e => handleChange("lastName", e.target.value)}
                            className={`pl-10 py-3 text-base rounded-xl border transition-colors ${
                              errors.lastName ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
                            }`}
                            placeholder="Last name"
                            disabled={loading}
                          />
                        </div>
                        {errors.lastName && <p className="mt-1 text-xs text-red-600 font-medium">{errors.lastName}</p>}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="email" className="text-gray-700 font-semibold text-sm mb-1 block">
                      Email Address
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={e => handleChange("email", e.target.value)}
                        className={`pl-10 py-3 text-base rounded-xl border transition-colors ${
                          errors.email ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
                        }`}
                        placeholder="you@email.com"
                        disabled={loading}
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-600 font-medium">{errors.email}</p>}
                  </div>

                  {mode === "signup" && (
                    <div>
                      <Label className="text-gray-700 font-semibold text-sm mb-1 block">
                        Mobile Number
                      </Label>
                      <PhoneInput
                        value={form.mobile}
                        onChange={val => handleChange("mobile", val)}
                        disabled={loading}
                        error={!!errors.mobile}
                        placeholder="Your mobile number"
                      />
                      {errors.mobile && <p className="mt-1 text-xs text-red-600 font-medium">{errors.mobile}</p>}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="password" className="text-gray-700 font-semibold text-sm mb-1 block">
                      Password
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="password"
                        type={showPwd ? "text" : "password"}
                        value={form.password}
                        onChange={e => handleChange("password", e.target.value)}
                        className={`pl-10 pr-10 py-3 text-base rounded-xl border transition-colors ${
                          errors.password ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
                        }`}
                        placeholder={mode === 'signup' ? 'Create password' : 'Password'}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password}</p>}
                    {mode === "signup" && (
                      <p className="mt-1 text-xs text-gray-500">8+ characters with uppercase, lowercase, and number</p>
                    )}
                  </div>

                  {mode === "login" && (
                    <div className="text-center">
                      <button
                        type="button"
                        className="text-sm font-medium text-[#8b0000] hover:text-red-700 transition-colors"
                        onClick={() => setShowForgot(true)}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#8b0000] hover:bg-red-700 text-white font-semibold py-3 text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : mode === "signup" ? (
                      <>
                        Create Account
                        <Heart className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 px-4">
            <p className="text-xs text-gray-500">
              By joining, you agree to our{" "}
              <a href="/terms-of-service" className="text-[#8b0000] hover:text-red-700 font-medium">
                Terms
              </a>{" "}
              and{" "}
              <a href="/privacy-policy" className="text-[#8b0000] hover:text-red-700 font-medium">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPageWrapper() {
  const [showAuth, setShowAuth] = useState(false);
  const [initialMode, setInitialMode] = useState<"signup" | "login">("signup");

  if (!showAuth) {
    return (
      <LandingSlider
        onCreate={() => {
          setInitialMode("signup");
          setShowAuth(true);
        }}
        onLogin={() => {
          setInitialMode("login");
          setShowAuth(true);
        }}
      />
    );
  }

  return <MobileAuthPage initialMode={initialMode} onBack={() => setShowAuth(false)} />;
}

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (user || profile)) {
      // Only redirect to dashboard if user is authenticated AND onboarded
      if (profile?.is_onboarded) {
        router.replace("/dashboard");
      }
    }
  }, [loading, user, profile, router]);

  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[#8b0000]" />
    </div>}>
      <JsonLd />
      <AuthPageWrapper />
    </Suspense>
  );
}
