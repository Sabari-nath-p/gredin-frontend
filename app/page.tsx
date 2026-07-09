import type { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp, BarChart3, Wallet, Shield, CheckCircle,
  ArrowRight, Target, Calendar, Layers, FileText, PieChart,
  Activity, Zap, Globe, Lock, Users, LineChart, BookOpen,
  Award, Filter, Bell, ChevronRight, Star, Tag, Camera,
  RefreshCw, Database, Clock, BarChart2,
} from 'lucide-react';
import Image from 'next/image';
import LandingCTAButton from '@/components/LandingCTAButton';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gredin.app';

export const metadata: Metadata = {
  title: 'Gredin — Professional Trading Journal & Performance Tracker',
  description:
    'The #1 professional trading journal for stocks, forex, crypto & options traders. Log trades, analyze performance, track win rates, manage multiple accounts & custom templates. Free to use.',
  keywords: [
    'trading journal', 'trade journal app', 'trading log', 'stock trading journal',
    'forex trading journal', 'crypto trading journal', 'options trading journal',
    'trading performance tracker', 'trade tracking software', 'day trading journal',
    'swing trading journal', 'funded account journal', 'FTMO journal',
    'trading analytics', 'win rate tracker', 'profit factor calculator',
    'trading diary', 'online trading journal', 'free trading journal',
    'professional trading journal', 'trade entry log', 'trading discipline',
  ],
  authors: [{ name: 'Gredin' }],
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Gredin',
    title: 'Gredin — Professional Trading Journal & Performance Tracker',
    description:
      'Log every trade, analyse your performance, and level up your strategy. The professional trading journal for serious traders.',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Gredin Dashboard Preview' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gredin — Professional Trading Journal',
    description: 'The #1 free trading journal. Track stocks, forex, crypto & options with powerful analytics.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Gredin',
      url: SITE_URL,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web Browser',
      browserRequirements: 'Requires JavaScript',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
      description:
        'Professional trading journal to log trades, track performance, manage accounts, and analyse win rates across stocks, forex, crypto and options.',
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '842', bestRating: '5' },
      featureList: [
        'Trade Entry & Exit Logging', 'Multi-Account Management', 'Win Rate & Profit Factor Analytics',
        'Custom Log Templates', 'Image Upload via Amazon S3', 'Trade Calendar View',
        'Advanced Filtering & Export', 'OTP Email Authentication',
      ],
    },
    {
      '@type': 'WebSite',
      url: SITE_URL,
      name: 'Gredin',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'What is a trading journal?', acceptedAnswer: { '@type': 'Answer', text: 'A trading journal is a record of all your trades that helps you track performance, identify patterns, enforce discipline, and improve your strategy over time.' } },
        { '@type': 'Question', name: 'Is Gredin free to use?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Gredin is completely free. Sign up with your email and start logging trades immediately — no credit card, no limits.' } },
        { '@type': 'Question', name: 'Does Gredin work for forex, stocks, crypto, and options?', acceptedAnswer: { '@type': 'Answer', text: 'Absolutely. Gredin is market-agnostic. You can log trades for any instrument across multiple accounts.' } },
        { '@type': 'Question', name: 'Can I use Gredin for funded accounts like FTMO?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Create a dedicated account for each funded programme and track drawdown, daily loss, and profit targets.' } },
        { '@type': 'Question', name: 'What analytics does Gredin provide?', acceptedAnswer: { '@type': 'Answer', text: 'Gredin tracks win rate, profit factor, total P&L, best and worst trades, average risk/reward ratio, performance by symbol and time-of-day, and equity curve over time.' } },
        { '@type': 'Question', name: 'What are custom log templates?', acceptedAnswer: { '@type': 'Answer', text: 'Custom log templates let you add extra fields to your trade entries — text notes, checkboxes, long descriptions, or images. Assign templates to specific accounts so every trade captures the most relevant information.' } },
      ],
    },
  ],
};

const features = [
  { icon: BarChart3, title: 'Deep Analytics', desc: 'Win rate, profit factor, R-multiple, equity curve — 20+ metrics updated in real time so you always know where you stand.' },
  { icon: Wallet, title: 'Multi-Account Manager', desc: 'Keep live accounts, paper trading, and funded challenge accounts completely separate, each with its own stats and rules.' },
  { icon: Layers, title: 'Custom Log Templates', desc: 'Build templates with text fields, checkboxes, long-form notes, and screenshot uploads. Assign each template per account.' },
  { icon: Calendar, title: 'Trade Calendar', desc: 'See your daily P&L on a heatmap calendar. Instantly spot your best trading days and the patterns you might be missing.' },
  { icon: Camera, title: 'Screenshot Storage', desc: 'Attach chart screenshots to any trade via Amazon S3. Review your setup and execution side-by-side, every time.' },
  { icon: Shield, title: 'Secure & Private', desc: 'OTP email authentication, encrypted storage, zero third-party data sharing. Your trading data stays yours.' },
];

const steps = [
  { n: '01', icon: BookOpen, title: 'Create your account', body: 'Sign up with your email in seconds. No password to remember, no credit card required. A one-time OTP keeps things secure.' },
  { n: '02', icon: Wallet, title: 'Set up trading accounts', body: 'Add your brokerage, paper, or funded accounts. Set currency, starting balance, and any account-specific rules.' },
  { n: '03', icon: FileText, title: 'Log every trade', body: 'Enter symbol, direction, size, entry and exit. Attach screenshots. Use custom templates for strategy-specific data.' },
  { n: '04', icon: PieChart, title: 'Analyse and improve', body: 'Open the Analytics dashboard. See your win rate, profit factor, best setups, worst mistakes, and an equity curve that never lies.' },
];

const useCases = [
  { icon: TrendingUp, label: 'Day Traders', desc: 'High-frequency intraday logging with time-of-day performance breakdown.' },
  { icon: LineChart, label: 'Swing Traders', desc: 'Multi-day position tracking with R-multiple and holding-period analysis.' },
  { icon: Globe, label: 'Forex Traders', desc: 'Pip-based P&L, currency pair performance, and session breakdowns.' },
  { icon: Activity, label: 'Crypto Traders', desc: 'Spot and perpetual futures support for volatile digital assets.' },
  { icon: Tag, label: 'Options Traders', desc: 'Log premium, strike, expiry, and IV to measure strategy edge over time.' },
  { icon: Award, label: 'Funded Traders', desc: 'Monitor drawdown and daily loss limits to stay inside FTMO and prop-firm rules.' },
];

const allFeatures = [
  'Unlimited trade entries', 'Multi-account management',
  'Advanced analytics dashboard', 'Win rate & profit factor',
  'Equity curve visualisation', 'Trade calendar heatmap',
  'Custom log templates', 'Short text & long-form note fields',
  'Checkbox fields for rule enforcement', 'Image upload via Amazon S3',
  'Open & closed trade tracking', 'P&L in any currency',
  'Advanced search & filtering', 'Mobile-responsive UI',
  'OTP email authentication', 'Encrypted data storage',
  'No ads, no data selling', 'Free — always',
];

const faqs: { q: string; a: string }[] = [
  { q: 'What is a trading journal and why do I need one?', a: 'A trading journal is a systematic record of your trades, emotions, strategy notes, and outcomes. Research consistently shows that traders who journal perform significantly better over time — they identify edge, eliminate repeating mistakes, and build the discipline needed for consistent profitability.' },
  { q: 'What should I track in my trading journal?', a: "At minimum: instrument, direction, entry price, exit price, position size, and net P&L. Advanced traders also record setup type, risk/reward ratio, market conditions, emotional state, and screenshots of entry and exit. Gredin's custom templates let you capture all of this without extra friction." },
  { q: 'Is Gredin free to use?', a: 'Yes — completely free. Create an account with just your email address and start logging trades immediately. No subscription, no credit card, no hidden fees.' },
  { q: 'Does Gredin work for forex, stocks, crypto, and options?', a: 'Yes. Gredin is instrument-agnostic. Log trades for any market — equities, ETFs, futures, forex pairs, cryptocurrencies, and options contracts. Manage separate accounts per market so your analytics stay clean and meaningful.' },
  { q: 'Can I use Gredin for funded account challenges (FTMO, MyFundedFX, etc.)?', a: 'Absolutely. Create a dedicated account for each funded programme. Track your current drawdown and daily loss so you never accidentally breach the rules of your challenge.' },
  { q: 'What analytics and performance metrics does Gredin calculate?', a: 'Gredin tracks win rate %, profit factor, total net P&L, gross profit and loss, average winner vs average loser, R-multiple, maximum drawdown, best and worst trade, performance by symbol, and equity curve over selectable time ranges.' },
  { q: 'How do custom log templates work?', a: 'You create a template with any combination of fields: short text, long-form notes, checkboxes, and image uploads. You then assign that template to one or more trading accounts. Every time you log a trade on that account, the template fields appear automatically.' },
  { q: 'Is my trading data private and secure?', a: 'Yes. All data is stored in an encrypted database. Access is protected by OTP email authentication. We do not sell, share, or analyse your personal trading data with any third party.' },
];

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#07090d] text-white overflow-x-hidden">

        {/* ── NAV ── */}
        <nav className="sticky top-0 z-50 bg-[#07090d]/95 backdrop-blur-sm border-b border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-5 h-24 flex items-center justify-between" style={{ height: '100px' }}>
            <Link href="/" className="flex items-center gap-2.5" aria-label="Gredin home">
              <Image src="/logo.png" alt="Gredin Logo" width={180} height={50} priority />
            </Link>

            <div className="hidden md:flex items-center gap-7 text-[13px] text-white/50">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
              <a href="#use-cases" className="hover:text-white transition-colors">Who it's for</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:block text-[13px] text-white/50 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <LandingCTAButton size="sm" compactOnMobile />
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="pt-20 pb-24 px-5" aria-label="Hero">
          <div className="max-w-3xl mx-auto text-center">

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#047857]/20 rounded-full text-[#047857] text-[11px] font-semibold tracking-widest uppercase mb-10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#047857] inline-block" />
              Free for all traders — no credit card needed
            </div>

            <h1 className="text-[42px] sm:text-[56px] lg:text-[64px] font-extrabold text-white leading-[1.08] tracking-[-0.03em] mb-6">
              The trading journal that{' '}
              <span className="text-[#047857]">actually improves</span>{' '}
              your results
            </h1>

            <p className="text-[17px] sm:text-[19px] text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
              Log every trade, measure what matters, and let data expose your edge — and your blind spots.
              Used by stock, forex, crypto, options, and funded-account traders worldwide.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
              <LandingCTAButton size="lg" />
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 text-[14px] font-medium text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all"
              >
                See how it works
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Dashboard mockup */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0d1017] overflow-hidden text-left">
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-[#0a0d12]">
                <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
                <span className="ml-4 text-[11px] text-white/25 font-mono">gredin.in/dashboard</span>
              </div>

              {/* Stats row */}
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Win Rate', value: '68.4%', delta: '+3.2% this month', green: true },
                  { label: 'Profit Factor', value: '2.14', delta: 'Last 30 trades', green: true },
                  { label: 'Net P&L', value: '+$4,820', delta: 'All accounts', green: true },
                  { label: 'Open Trades', value: '3', delta: 'Active positions', green: false },
                ].map((s) => (
                  <div key={s.label} className="bg-[#0a0d12] rounded-xl p-4 border border-white/[0.05]">
                    <p className="text-[10px] text-white/35 mb-1.5 uppercase tracking-widest">{s.label}</p>
                    <p className={`text-[22px] font-bold leading-none ${s.green ? 'text-[#047857]' : 'text-white'}`}>{s.value}</p>
                    <p className="text-[10px] text-white/30 mt-1.5">{s.delta}</p>
                  </div>
                ))}
              </div>

              {/* Recent trades */}
              <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { sym: 'EUR/USD', dir: 'LONG', pnl: '+$320', win: true },
                  { sym: 'AAPL', dir: 'SHORT', pnl: '−$85', win: false },
                  { sym: 'BTC/USDT', dir: 'LONG', pnl: '+$1,240', win: true },
                ].map((r) => (
                  <div key={r.sym} className="flex items-center justify-between bg-[#0a0d12] rounded-xl px-4 py-3 border border-white/[0.05]">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-white">{r.sym}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40 font-mono">{r.dir}</span>
                      </div>
                    </div>
                    <p className={`text-[14px] font-bold ${r.win ? 'text-[#047857]' : 'text-red-400'}`}>{r.pnl}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="py-12 border-y border-white/[0.06]" aria-label="Platform stats">
          <div className="max-w-4xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10,000+', label: 'Active traders' },
              { value: '2M+', label: 'Trades logged' },
              { value: '98%', label: 'Uptime SLA' },
              { value: '4.9/5', label: 'Average rating' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-[28px] font-extrabold text-[#047857] mb-1 tracking-tight">{s.value}</p>
                <p className="text-[13px] text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-24 px-5" aria-labelledby="features-heading">
          <div className="max-w-5xl mx-auto">
            <div className="mb-14">
              <p className="text-[#047857] text-[11px] font-semibold tracking-widest uppercase mb-3">Everything you need</p>
              <h2 id="features-heading" className="text-[32px] sm:text-[40px] font-extrabold text-white tracking-tight leading-tight mb-4">
                A complete trading journal platform
              </h2>
              <p className="text-white/45 text-[16px] max-w-lg">
                Every feature is designed around one goal: helping you understand your trading
                clearly enough to act on it.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
              {features.map((f, i) => (
                <article
                  key={f.title}
                  className="bg-[#07090d] p-7 hover:bg-[#0d1017] transition-colors"
                >
                  <f.icon className="w-5 h-5 text-[#047857] mb-5" strokeWidth={1.5} />
                  <h3 className="text-[15px] font-semibold text-white mb-2">{f.title}</h3>
                  <p className="text-[13px] text-white/45 leading-relaxed">{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-24 px-5 border-t border-white/[0.06]" aria-labelledby="hiw-heading">
          <div className="max-w-5xl mx-auto">
            <div className="mb-14">
              <p className="text-[#047857] text-[11px] font-semibold tracking-widest uppercase mb-3">Get started in minutes</p>
              <h2 id="hiw-heading" className="text-[32px] sm:text-[40px] font-extrabold text-white tracking-tight leading-tight mb-4">
                How Gredin works
              </h2>
              <p className="text-white/45 text-[16px] max-w-lg">
                From sign-up to your first analytics insight in under five minutes.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {steps.map((s, i) => (
                <article key={s.n} className="relative">
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-5 left-[calc(50%+24px)] right-0 h-px bg-white/[0.06]" />
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl border border-white/[0.08] bg-[#0d1017] flex items-center justify-center flex-shrink-0">
                      <s.icon className="w-4.5 h-4.5 text-[#047857]" strokeWidth={1.5} style={{ width: '18px', height: '18px' }} />
                    </div>
                    <span className="text-[11px] text-white/20 font-mono font-bold">{s.n}</span>
                  </div>
                  <h3 className="text-[14px] font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-[13px] text-white/40 leading-relaxed">{s.body}</p>
                </article>
              ))}
            </div>

            <div className="mt-14">
              <LandingCTAButton size="lg" />
            </div>
          </div>
        </section>

        {/* ── ANALYTICS DEEP DIVE ── */}
        <section className="py-24 px-5 border-t border-white/[0.06]" aria-labelledby="analytics-heading">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-[#047857] text-[11px] font-semibold tracking-widest uppercase mb-3">Analytics</p>
              <h2 id="analytics-heading" className="text-[32px] sm:text-[40px] font-extrabold text-white tracking-tight leading-tight mb-5">
                Performance metrics that drive real improvement
              </h2>
              <p className="text-white/45 text-[15px] mb-8 leading-relaxed">
                Move beyond "I think I'm profitable." See your exact win rate, how much you make on winners
                versus losers, which symbols produce your edge, and when your worst trades cluster — all live.
              </p>
              <ul className="space-y-3">
                {[
                  'Win rate % and loss rate breakdown',
                  'Profit factor — gross profit divided by gross loss',
                  'Average R-multiple and expectancy',
                  'Equity curve with drawdown overlay',
                  'Performance by symbol, session, and setup',
                  'Best and worst day heatmap calendar',
                  'Streak analysis — wins, losses, breakevens',
                  'Filtered views by account or date range',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[13px] text-white/50">
                    <CheckCircle className="w-4 h-4 text-[#047857] flex-shrink-0 mt-0.5" strokeWidth={2} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Equity card */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0d1017] p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[13px] font-semibold text-white">Equity curve — last 30 trades</p>
                <span className="text-[12px] px-2.5 py-1 rounded-lg bg-[#047857]/10 text-[#047857] font-mono font-semibold">+$4,820</span>
              </div>
              <svg viewBox="0 0 360 100" className="w-full h-28 mb-5" aria-label="Equity curve showing upward trend">
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#047857" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#047857" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,90 L20,84 L40,87 L60,72 L80,68 L100,74 L120,60 L140,64 L160,48 L180,42 L200,53 L220,37 L240,33 L260,40 L280,25 L300,18 L320,23 L340,11 L360,6"
                  stroke="#047857" strokeWidth="2" fill="none" strokeLinecap="round"
                />
                <path
                  d="M0,90 L20,84 L40,87 L60,72 L80,68 L100,74 L120,60 L140,64 L160,48 L180,42 L200,53 L220,37 L240,33 L260,40 L280,25 L300,18 L320,23 L340,11 L360,6 L360,100 L0,100 Z"
                  fill="url(#eq)"
                />
              </svg>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Win rate', val: '68.4%', green: true },
                  { label: 'Profit factor', val: '2.14', green: true },
                  { label: 'Max drawdown', val: '4.2%', green: false },
                ].map((m) => (
                  <div key={m.label} className="text-center bg-[#0a0d12] rounded-xl p-3 border border-white/[0.05]">
                    <p className={`text-[16px] font-bold ${m.green ? 'text-[#047857]' : 'text-red-400'}`}>{m.val}</p>
                    <p className="text-[10px] text-white/30 mt-1">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CUSTOM TEMPLATES ── */}
        <section className="py-24 px-5 border-t border-white/[0.06]" aria-labelledby="templates-heading">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
            {/* Template mockup */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0d1017] p-6 order-2 lg:order-1">
              <div className="flex items-center gap-2.5 mb-6">
                <Layers className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                <p className="text-[13px] font-semibold text-white">Forex setup template</p>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#047857]/10 text-[#047857] font-semibold">Active</span>
              </div>
              <div className="space-y-3">
                {[
                  { type: 'TEXT', label: 'Setup type', placeholder: 'e.g. London Breakout' },
                  { type: 'CHECKBOX', label: 'Followed trading plan', placeholder: '' },
                  { type: 'LONG_TEXT', label: 'Pre-trade analysis', placeholder: 'Market structure, confluence...' },
                  { type: 'IMAGE', label: 'Entry screenshot', placeholder: '' },
                ].map((f) => (
                  <div key={f.label} className="bg-[#0a0d12] border border-white/[0.05] rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-medium text-white">{f.label}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${f.type === 'IMAGE' ? 'bg-red-500/10 text-red-400' :
                          f.type === 'CHECKBOX' ? 'bg-[#047857]/10 text-[#047857]' :
                            f.type === 'LONG_TEXT' ? 'bg-purple-500/10 text-purple-400' :
                              'bg-blue-500/10 text-blue-400'
                        }`}>{f.type}</span>
                    </div>
                    {f.type === 'CHECKBOX' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border border-[#047857]/40 bg-[#047857]/10 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-[#047857]" />
                        </div>
                        <span className="text-[12px] text-white/40">Yes</span>
                      </div>
                    ) : f.type === 'IMAGE' ? (
                      <div className="border border-dashed border-white/10 rounded-lg h-9 flex items-center justify-center gap-2">
                        <Camera className="w-3.5 h-3.5 text-white/25" />
                        <span className="text-[11px] text-white/25">Upload chart screenshot</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-white/20 italic">{f.placeholder}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <p className="text-[#047857] text-[11px] font-semibold tracking-widest uppercase mb-3">Custom templates</p>
              <h2 id="templates-heading" className="text-[32px] sm:text-[40px] font-extrabold text-white tracking-tight leading-tight mb-5">
                Your journal, your fields
              </h2>
              <p className="text-white/45 text-[15px] mb-8 leading-relaxed">
                Every strategy is different. Custom log templates let you capture the exact information
                relevant to your approach — inside each trade entry, automatically.
              </p>
              <ul className="space-y-5">
                {[
                  { icon: FileText, label: 'Short text fields', desc: 'Quick labels — setup type, session, confluence count.' },
                  { icon: BookOpen, label: 'Long-form note fields', desc: 'Full pre-trade analysis and post-trade review in your own words.' },
                  { icon: CheckCircle, label: 'Checkbox fields', desc: 'Enforce your rules. "Did I follow my plan? Was risk defined?"' },
                  { icon: Camera, label: 'Image upload fields', desc: 'Attach entry and exit chart screenshots, stored securely in S3.' },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg border border-white/[0.08] bg-[#0d1017] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-3.5 h-3.5 text-[#047857]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-white mb-1">{item.label}</p>
                      <p className="text-[12px] text-white/40 leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── USE CASES ── */}
        <section id="use-cases" className="py-24 px-5 border-t border-white/[0.06]" aria-labelledby="usecases-heading">
          <div className="max-w-5xl mx-auto">
            <div className="mb-14">
              <p className="text-[#047857] text-[11px] font-semibold tracking-widest uppercase mb-3">Who it's for</p>
              <h2 id="usecases-heading" className="text-[32px] sm:text-[40px] font-extrabold text-white tracking-tight leading-tight mb-4">
                Built for every type of trader
              </h2>
              <p className="text-white/45 text-[16px] max-w-lg">
                Whether you trade equities before the open bell or Bitcoin at midnight, Gredin adapts to your workflow.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
              {useCases.map((u) => (
                <article key={u.label} className="bg-[#07090d] p-6 hover:bg-[#0d1017] transition-colors">
                  <u.icon className="w-5 h-5 text-[#047857] mb-4" strokeWidth={1.5} />
                  <h3 className="text-[14px] font-semibold text-white mb-1.5">{u.label}</h3>
                  <p className="text-[12px] text-white/40 leading-relaxed">{u.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── FULL FEATURE CHECKLIST ── */}
        <section className="py-24 px-5 border-t border-white/[0.06]" aria-labelledby="checklist-heading">
          <div className="max-w-3xl mx-auto">
            <div className="mb-12">
              <p className="text-[#047857] text-[11px] font-semibold tracking-widest uppercase mb-3">Full feature list</p>
              <h2 id="checklist-heading" className="text-[32px] sm:text-[40px] font-extrabold text-white tracking-tight leading-tight">
                Everything included. Nothing locked away.
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-0">
              {allFeatures.map((item) => (
                <div key={item} className="flex items-center gap-3 py-3 border-b border-white/[0.05]">
                  <CheckCircle className="w-3.5 h-3.5 text-[#047857] flex-shrink-0" strokeWidth={2.5} />
                  <span className="text-[13px] text-white/55">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-14">
              <LandingCTAButton size="lg" />
              <p className="text-[12px] text-white/25 mt-4">No credit card · No setup fee · 100% free</p>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-24 px-5 border-t border-white/[0.06]" aria-labelledby="faq-heading">
          <div className="max-w-2xl mx-auto">
            <div className="mb-12">
              <p className="text-[#047857] text-[11px] font-semibold tracking-widest uppercase mb-3">FAQ</p>
              <h2 id="faq-heading" className="text-[32px] sm:text-[40px] font-extrabold text-white tracking-tight leading-tight mb-4">
                Common questions about trading journals
              </h2>
              <p className="text-white/45 text-[15px]">
                Everything you need to know about journaling your trades and improving your performance.
              </p>
            </div>

            <div className="space-y-px">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group border-b border-white/[0.06] py-1"
                >
                  <summary className="flex items-center justify-between gap-6 cursor-pointer py-4 list-none">
                    <h3 className="text-[14px] font-medium text-white/80 text-left group-hover:text-white transition-colors">{faq.q}</h3>
                    <ChevronRight className="w-4 h-4 text-white/25 flex-shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="pb-5">
                    <p className="text-[13px] text-white/40 leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-28 px-5 border-t border-white/[0.06]" aria-labelledby="cta-heading">
          <div className="max-w-xl mx-auto text-center">
            <h2 id="cta-heading" className="text-[36px] sm:text-[48px] font-extrabold text-white tracking-tight leading-tight mb-5">
              Ready to trade with{' '}
              <span className="text-[#047857]">real clarity?</span>
            </h2>
            <p className="text-[16px] text-white/45 mb-10 leading-relaxed">
              Join thousands of traders who use Gredin to stay disciplined, find their real edge,
              and grow their accounts — starting with their very next trade.
            </p>
            <LandingCTAButton size="lg" />
            <p className="text-[12px] text-white/20 mt-5">
              No credit card · No limits · Works for stocks, forex, crypto & options
            </p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/[0.06] py-12 px-5" role="contentinfo">
          <div className="max-w-5xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
              <div>
                <Link href="/" className="flex items-center gap-2 mb-4">
                  <Image src="/logo.png" alt="Gredin Logo" width={180} height={50} />
                </Link>
                <p className="text-[12px] text-white/30 leading-relaxed">
                  The professional trading journal for serious traders. Log smarter, analyse deeper, improve faster.
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-4">Product</h4>
                <ul className="space-y-2.5 text-[12px] text-white/35">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
                  <li><a href="#use-cases" className="hover:text-white transition-colors">Who it's for</a></li>
                  <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-4">Trader types</h4>
                <ul className="space-y-2.5 text-[12px] text-white/35">
                  <li>Day traders</li>
                  <li>Swing traders</li>
                  <li>Forex traders</li>
                  <li>Funded / prop traders</li>
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-4">Account</h4>
                <ul className="space-y-2.5 text-[12px] text-white/35">
                  <li><Link href="/login" className="hover:text-white transition-colors">Sign in</Link></li>
                  <li><Link href="/login" className="hover:text-white transition-colors">Create account</Link></li>
                  <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[12px] text-white/20">
                &copy; {new Date().getFullYear()} Gredin. All rights reserved.
              </p>
              <div className="flex items-center gap-5 text-[11px] text-white/20">
                <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" />Encrypted</span>
                <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" />Private</span>
                <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" />Free forever</span>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}