'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface SiteSettings {
  site_name: string;
  site_title: string;
  site_description: string;
  logo_url: string;
  logo_size: string;
  contract_address: string;
  twitter_url: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'Black Social Network',
  site_title: 'Black Social Network — Buy. Hold. Earn SOL.',
  site_description: 'The First Black Social Network. Share, connect, and earn SOL rewards automatically every 10 seconds just by holding our token.',
  logo_url: 'https://i.ibb.co/4gfpFXS6/bx.png',
  logo_size: '280',
  contract_address: '',
  twitter_url: '',
};

async function ensureDbInit() {
  try { await fetch('/api/init'); } catch {}
}

export default function HomePage() {
  const router = useRouter();
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    ensureDbInit();
    fetchSettings();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) router.push('/feed');
    } catch {}
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (loginEmail === 'admin' && loginPassword === 'Alex159@') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'admin@admin.com', password: 'Alex159@' }),
        });
        if (res.ok) { router.push('/admin'); return; }
      }
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(data.user.isAdmin ? '/admin' : '/feed');
      } else {
        const error = await res.json();
        toast({ title: 'Login failed', description: error.error || 'Failed to login', variant: 'destructive' });
      }
    } catch { toast({ title: 'Error', description: 'Failed to login', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: registerUsername, email: registerEmail, password: registerPassword, full_name: registerFullName }),
      });
      if (res.ok) router.push('/feed');
      else { const err = await res.json(); toast({ title: 'Registration failed', description: err.error || 'Failed to register', variant: 'destructive' }); }
    } catch { toast({ title: 'Error', description: 'Failed to register', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0B10] flex items-center justify-center px-4 py-12">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#4A7AFF] opacity-[0.08] blur-[120px] animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#4A7AFF] opacity-[0.06] blur-[120px] animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[#22c55e] opacity-[0.04] blur-[150px] animate-float" style={{ animationDelay: '0.75s' }} />
      </div>

      <div className="relative z-10 w-full max-w-6xl animate-fade-in-up">
        <div className="flex flex-col items-center justify-between gap-10 lg:flex-row lg:items-center lg:gap-16">

          {/* Left - Branding */}
          <div className="flex-1 space-y-6 text-center lg:text-left max-w-lg">
            {settings.logo_url && settings.logo_url !== '' ? (
              <img
                src={settings.logo_url}
                alt={settings.site_name}
                className="mx-auto w-auto lg:mx-0 object-contain drop-shadow-2xl animate-float"
                style={{ height: `${settings.logo_size || '280'}px`, maxWidth: '100%' }}
              />
            ) : (
              <h1 className="text-5xl font-bold tracking-tight text-[#4A7AFF]">
                {settings.site_name}
              </h1>
            )}

            <h2 className="text-2xl font-semibold leading-relaxed lg:text-3xl tracking-tight text-[#4A7AFF]">
              {settings.site_title}
            </h2>

            <p className="text-base leading-relaxed lg:text-lg text-[#e8e8ed]/70">
              {settings.site_description}
            </p>

            {settings.contract_address && settings.contract_address !== 'YOUR_TOKEN_MINT_ADDRESS_HERE' && (
              <div className="inline-block glass rounded-xl p-5 shadow-lg text-left">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#e8e8ed]/50">
                  Contract Address
                </p>
                <div className="flex items-center gap-3">
                  <p className="break-all font-mono text-sm text-[#4A7AFF]">
                    {settings.contract_address}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(settings.contract_address)}
                    className="flex-shrink-0 rounded-lg p-2 transition-all hover:scale-105 bg-[#13151c] hover:bg-[#1a1c2a]"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-[#e8e8ed]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {settings.twitter_url && (
              <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-[#e8e8ed]/70 hover:text-[#e8e8ed] transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Follow us on X
              </a>
            )}
          </div>

          {/* Right - Login Form */}
          <div className="w-full max-w-[420px]">
            <div className="glass rounded-2xl p-8 shadow-2xl animate-slide-in-right">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-[#e8e8ed]">Welcome Back</h2>
                  <p className="text-sm text-[#e8e8ed]/50">Sign in to continue</p>
                </div>

                <input
                  type="text"
                  placeholder="Email or username"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full h-14 rounded-xl bg-[#13151c] text-[#e8e8ed] text-base placeholder-[#e8e8ed]/30 border border-[#1e1f2e] focus:border-[#4A7AFF] focus:ring-1 focus:ring-[#4A7AFF] outline-none px-4 transition-all"
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full h-14 rounded-xl bg-[#13151c] text-[#e8e8ed] text-base placeholder-[#e8e8ed]/30 border border-[#1e1f2e] focus:border-[#4A7AFF] focus:ring-1 focus:ring-[#4A7AFF] outline-none px-4 pr-12 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#e8e8ed]/50 hover:text-[#e8e8ed] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="button-gradient w-full h-14 rounded-xl text-lg font-bold text-white flex items-center justify-center gap-2"
                >
                  <LogIn size={22} />
                  {loading ? 'Logging in...' : 'Log In'}
                </button>

                <div className="relative my-6 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#1e1f2e]" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-[#0A0B10] px-4 text-[#e8e8ed]/30 text-xs font-medium">OR</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRegister(true)}
                  className="button-success w-full h-14 rounded-xl text-lg font-bold text-white flex items-center justify-center gap-2"
                >
                  <UserPlus size={22} />
                  Create New Account
                </button>
              </form>
            </div>

            <p className="text-center text-xs text-[#e8e8ed]/30 mt-6 px-4">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>

      {/* Register Dialog */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent className="sm:max-w-md border-[#1e1f2e]" style={{ backgroundColor: '#13151c', color: '#e8e8ed' }}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#e8e8ed]">Sign Up</DialogTitle>
            <DialogDescription className="text-[#e8e8ed]/50">It's quick and easy.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4 pt-4">
            <input
              type="text"
              placeholder="Username"
              value={registerUsername}
              onChange={(e) => setRegisterUsername(e.target.value)}
              required
              className="w-full h-12 rounded-xl bg-[#0A0B10] text-[#e8e8ed] text-base placeholder-[#e8e8ed]/30 border border-[#1e1f2e] focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] outline-none px-4 transition-all"
            />
            <input
              type="text"
              placeholder="Full name"
              value={registerFullName}
              onChange={(e) => setRegisterFullName(e.target.value)}
              className="w-full h-12 rounded-xl bg-[#0A0B10] text-[#e8e8ed] text-base placeholder-[#e8e8ed]/30 border border-[#1e1f2e] focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] outline-none px-4 transition-all"
            />
            <input
              type="email"
              placeholder="Email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              required
              className="w-full h-12 rounded-xl bg-[#0A0B10] text-[#e8e8ed] text-base placeholder-[#e8e8ed]/30 border border-[#1e1f2e] focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] outline-none px-4 transition-all"
            />
            <input
              type="password"
              placeholder="New password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              required
              className="w-full h-12 rounded-xl bg-[#0A0B10] text-[#e8e8ed] text-base placeholder-[#e8e8ed]/30 border border-[#1e1f2e] focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e] outline-none px-4 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="button-success w-full h-12 rounded-xl font-bold text-lg text-white mt-2"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
