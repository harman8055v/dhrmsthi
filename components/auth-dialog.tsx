"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import PhoneInput from "@/components/ui/phone-input";
import { User, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import React from "react";
import { logger } from "@/lib/logger";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "signup" | "login";
  prefillMobile?: string;
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

export default function AuthDialog({ isOpen, onClose, defaultMode = "login" }: AuthDialogProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">(defaultMode);
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
  // Capture referral code from URL
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState<string>("");

  React.useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam);
    }
  }, [searchParams]);

  // Reset the sent state after a short delay for button feedback
  React.useEffect(() => {
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
      // Optionally add phone validation here
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
        // Persist signup data in localStorage so SeedStage can prefill mobile & other details
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
          // Create a minimal profile row immediately after account creation
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
          onClose();
          router.push(`/auth-loading?userId=${data.user.id}&isNew=true`);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        onClose();
        router.push("/dashboard");
      }
    } catch (err: any) {
      setGeneralError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 border border-gray-100 bg-white backdrop-blur-md shadow-xl rounded-2xl overflow-hidden">
        <DialogTitle className="sr-only">{mode === "signup" ? "Sign up for DharmaSaathi" : "Log in to DharmaSaathi"}</DialogTitle>
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#8b0000] tracking-tight">
              {mode === "signup" ? "Create your account" : showForgot ? "Reset your password" : "Welcome back"}
            </h2>
            {!showForgot && (
              <button
                className="text-sm text-[#8b0000] underline font-medium hover:text-[#a30000] transition-colors"
                onClick={() => setMode(mode === "signup" ? "login" : "signup")}
                type="button"
              >
                {mode === "signup" ? "Log in" : "Sign up"}
              </button>
            )}
          </div>

          {generalError && !showForgot && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{generalError}</p>
            </div>
          )}

          {/* Forgot Password Flow */}
          {showForgot ? (
            <form
              onSubmit={async e => {
                e.preventDefault();
                setResetError(null);
                setResetSent(false);
                setResetJustSent(false);
                setLoading(true);
                try {
                  const resetRedirectUrl = `${window.location.origin}/reset-password`;
                  const { data, error } = await supabase.auth.resetPasswordForEmail(
                    resetEmail,
                    { redirectTo: resetRedirectUrl }
                  );
                  if (error) throw error;
                  setResetSent(true);
                  setResetJustSent(true);
                } catch (err: any) {
                  setResetError(err.message || "Could not send reset link");
                } finally {
                  setLoading(false);
                }
              }}
              className="space-y-6"
            >
              <div>
                <Label htmlFor="reset-email" className="text-gray-700 font-medium">Email Address</Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    className="pl-10"
                    placeholder="you@email.com"
                    disabled={loading}
                  />
                </div>
              </div>
              <p className="-mt-2 text-xs text-gray-600">
                If password reset isn’t working due to the ongoing issue, you can sign in using a magic login link instead. <a href="/password-recovery" className="text-[#8b0000] underline">Try magic login</a>.
              </p>
              {resetError && <p className="text-xs text-red-600 mt-1">{resetError}</p>}
              <Button
                type="submit"
                disabled={loading || resetJustSent}
                className={`w-full font-semibold py-3 transition-all duration-200 rounded-lg shadow-lg flex items-center justify-center gap-2 ${resetJustSent ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gradient-to-r from-[#8b0000] to-[#a30000] hover:from-[#a30000] hover:to-[#8b0000] text-white'}`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : resetJustSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Sent!
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-gray-700 border-gray-300 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setShowForgot(false);
                  setResetEmail("");
                  setResetError(null);
                  setResetSent(false);
                }}
              >
                <ArrowRight className="w-4 h-4 mr-1 rotate-180" /> Back to login
              </Button>
              {resetJustSent && (
                <p className="text-sm text-gray-700 text-center mt-3">
                  Please check your inbox (or spam folder) for the reset link.
                </p>
              )}
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-gray-700 font-medium">
                      First Name
                    </Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="firstName"
                        type="text"
                        value={form.firstName}
                        onChange={e => handleChange("firstName", e.target.value)}
                        className={`pl-10 ${errors.firstName ? "border-red-500" : ""}`}
                        placeholder="First name"
                        disabled={loading}
                      />
                    </div>
                    {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-gray-700 font-medium">
                      Last Name
                    </Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="lastName"
                        type="text"
                        value={form.lastName}
                        onChange={e => handleChange("lastName", e.target.value)}
                        className={`pl-10 ${errors.lastName ? "border-red-500" : ""}`}
                        placeholder="Last name"
                        disabled={loading}
                      />
                    </div>
                    {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => handleChange("email", e.target.value)}
                    className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                    placeholder="you@email.com"
                    disabled={loading}
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              {mode === "signup" && (
                <div>
                  <Label className="text-gray-700 font-medium">Mobile Number</Label>
                  <div className="mt-1">
                    <PhoneInput
                      value={form.mobile}
                      onChange={val => handleChange("mobile", val)}
                      disabled={loading}
                      error={!!errors.mobile}
                      placeholder="Your mobile number"
                    />
                  </div>
                  {errors.mobile && <p className="mt-1 text-xs text-red-600">{errors.mobile}</p>}
                </div>
              )}

              <div>
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={e => handleChange("password", e.target.value)}
                    className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                    placeholder={mode === 'signup' ? 'Create password' : 'Password'}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                <p className="mt-1 text-xs text-gray-500">8+ characters with uppercase, lowercase, and number</p>
              </div>

              {mode === "login" && (
                <button
                  type="button"
                  className="text-sm underline text-[#8b0000] hover:text-[#a30000] mt-1"
                  onClick={() => setShowForgot(true)}
                >
                  Forgot password?
                </button>
              )}
              {mode === "login" && (
                <p className="mt-2 text-xs text-gray-600">
                  Some users are experiencing password reset issues. We're working on it. In the meantime, you can use a magic login link to sign in. <a href="/password-recovery" className="text-[#8b0000] underline">Use magic login</a>.
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#8b0000] to-[#a30000] hover:from-[#a30000] hover:to-[#8b0000] text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none rounded-lg shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : mode === "signup" ? (
                  <>
                    Create Account <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Log In <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
