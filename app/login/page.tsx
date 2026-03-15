'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.sendOtp({ email });
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authApi.verifyOtp({ email, otp });
      const { accessToken, user } = response.data;
      setAuth(user, accessToken);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0e14] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-[#00ff88] opacity-[0.03] rounded-full blur-[120px] -top-64 -left-64" />
        <div className="absolute w-[400px] h-[400px] bg-[#3b82f6] opacity-[0.03] rounded-full blur-[100px] bottom-32 right-32" />
        <div className="absolute w-[300px] h-[300px] bg-[#00ff88] opacity-[0.02] rounded-full blur-[80px] top-1/2 left-1/3" />
      </div>

      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center px-16 xl:px-24">
        <div className="animate-fade-in">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-full text-[#00ff88] text-sm font-medium mb-8 hover:bg-[#00ff88]/15 transition-colors">
            <Sparkles className="w-4 h-4" />
            Professional Trading Journal
          </Link>

          <h1 className="text-5xl xl:text-6xl font-bold text-[#c9d1d9] mb-6 leading-tight tracking-tight">
            Master Your
            <br />
            <span className="gradient-text">Trading Journey</span>
          </h1>

          <p className="text-lg text-[#8b92a8] mb-12 max-w-lg leading-relaxed">
            Track every trade, analyze your performance, and build consistent profitability
            with our professional trading journal platform.
          </p>

          <div className="space-y-4">
            {[
              { emoji: '📊', title: 'Deep Analytics', desc: 'Win rate, profit factor, drawdown & 20+ metrics' },
              { emoji: '🗂️', title: 'Custom Templates', desc: 'Build your own trade log fields per strategy' },
              { emoji: '💼', title: 'Multi-Account', desc: 'Stocks, Forex, Crypto, Options — all in one place' },
              { emoji: '🔒', title: 'Secure & Private', desc: 'Your trading data stays yours, always' },
            ].map((f, i) => (
              <div
                key={f.title}
                className={`flex items-start gap-4 p-4 rounded-xl bg-[#111822]/50 border border-[#1e2936]/50 animate-fade-in stagger-${i + 2}`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#00ff88]/10 flex items-center justify-center flex-shrink-0 text-lg">
                  {f.emoji}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#c9d1d9] mb-0.5">{f.title}</h3>
                  <p className="text-sm text-[#8b92a8]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 relative">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile Logo */}
          <div className="text-center mb-10 lg:hidden">
            <Link href="/" className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#00ff88] to-[#00cc6f] rounded-2xl mb-4 shadow-[0_0_30px_rgba(0,255,136,0.3)]">
              <TrendingUp className="w-8 h-8 text-[#0a0e14]" />
            </Link>
            <h1 className="text-3xl font-bold gradient-text mb-1">Trade Journal</h1>
            <p className="text-sm text-[#8b92a8]">Professional trade logging</p>
          </div>

          <div className="card glass-effect p-8">
            {step === 'email' ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="hidden lg:flex w-10 h-10 bg-gradient-to-br from-[#00ff88] to-[#00cc6f] rounded-xl items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-[#0a0e14]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[#c9d1d9]">Welcome Back</h2>
                      <p className="text-sm text-[#8b92a8]">Enter your email to continue</p>
                    </div>
                  </div>
                </div>

                <div className="divider-green" />

                <div>
                  <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b92a8]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-12"
                      style={{ paddingLeft: '3rem' }}
                      placeholder="trader@example.com"
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-[#0a0e14] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <p className="text-center text-sm text-[#8b92a8]">
                  New here? Account created automatically ✨
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#c9d1d9] mb-1">Enter OTP</h2>
                  <p className="text-sm text-[#8b92a8]">
                    Code sent to <span className="text-[#00ff88] font-medium">{email}</span>
                  </p>
                </div>

                <div className="divider-green" />

                <div>
                  <label className="block text-sm font-medium text-[#c9d1d9] mb-2">
                    One-Time Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b92a8]" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="input-field pl-12 text-xl tracking-[0.3em] text-center font-mono"
                      style={{ paddingLeft: '3rem', letterSpacing: '0.22em' }}
                      placeholder="000000"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-[#0a0e14] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Verify &amp; Login <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <button type="button" onClick={() => setStep('email')} className="btn-secondary w-full">
                  ← Back to Email
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-[#8b92a8]/60 hover:text-[#00ff88] transition-colors">
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
