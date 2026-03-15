import type { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp, BarChart3, Wallet, Shield, CheckCircle,
  ArrowRight, Target, Calendar, Layers, FileText, PieChart,
  Activity, Zap, Globe, Lock, Users, LineChart, BookOpen,
  Award, Filter, Bell, ChevronRight, Star, Tag, Camera,
  RefreshCw, Database, Clock, BarChart2,
} from 'lucide-react';
import LandingCTAButton from '@/components/LandingCTAButton';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tradejournal.app';

export const metadata: Metadata = {
  title: 'Trade Journal — Professional Trading Journal & Performance Tracker',
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
  authors: [{ name: 'Trade Journal' }],
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Trade Journal',
    title: 'Trade Journal — Professional Trading Journal & Performance Tracker',
    description:
      'Log every trade, analyse your performance, and level up your strategy. The professional trading journal for serious traders.',
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Trade Journal Dashboard Preview' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trade Journal — Professional Trading Journal',
    description: 'The #1 free trading journal. Track stocks, forex, crypto & options with powerful analytics.',
    images: [`${SITE_URL}/og-image.png`],
  },
};

// ──────────────────────── JSON-LD structured data ────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'Trade Journal',
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
      name: 'Trade Journal',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'HowTo',
      name: 'How to Start a Professional Trading Journal',
      description: 'Step-by-step guide to setting up and using Trade Journal to track and improve your trading performance.',
      totalTime: 'PT5M',
      step: [
        { '@type': 'HowToStep', position: 1, name: 'Create Your Account', text: 'Sign up for free using your email address. No credit card required.' },
        { '@type': 'HowToStep', position: 2, name: 'Add a Trading Account', text: 'Create one or more trading accounts (live, paper, or funded) and set your initial balance and currency.' },
        { '@type': 'HowToStep', position: 3, name: 'Log Your First Trade', text: 'Enter trade details including symbol, direction, position size, entry & exit prices, and any notes.' },
        { '@type': 'HowToStep', position: 4, name: 'Analyse Your Performance', text: 'Visit the Analytics dashboard to see your win rate, profit factor, best setups, and areas for improvement.' },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'What is a trading journal?', acceptedAnswer: { '@type': 'Answer', text: 'A trading journal is a record of all your trades that helps you track performance, identify patterns, enforce discipline, and improve your strategy over time. Trade Journal provides a digital, analytics-powered journal for stocks, forex, crypto, and options traders.' } },
        { '@type': 'Question', name: 'Is Trade Journal free to use?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Trade Journal is completely free. Sign up with your email and start logging trades immediately — no credit card, no limits.' } },
        { '@type': 'Question', name: 'Does Trade Journal work for forex, stocks, crypto, and options?', acceptedAnswer: { '@type': 'Answer', text: 'Absolutely. Trade Journal is market-agnostic. You can log trades for any instrument — stocks, ETFs, futures, forex pairs, cryptocurrencies, or options — across multiple accounts.' } },
        { '@type': 'Question', name: 'Can I use Trade Journal for funded accounts like FTMO?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Many funded traders use Trade Journal to maintain discipline and meet challenge requirements. Create a dedicated account for each funded programme and track drawdown, daily loss, and profit targets.' } },
        { '@type': 'Question', name: 'What analytics does Trade Journal provide?', acceptedAnswer: { '@type': 'Answer', text: 'Trade Journal tracks win rate, profit factor, total P&L, best and worst trades, average risk/reward ratio, performance by symbol and time-of-day, and equity curve over time.' } },
        { '@type': 'Question', name: 'What are custom log templates?', acceptedAnswer: { '@type': 'Answer', text: 'Custom log templates let you add extra fields to your trade entries — text notes, checkboxes, long descriptions, or images. Assign templates to specific accounts so every trade in that account captures the information most relevant to your strategy.' } },
      ],
    },
  ],
};

// ─────────────────────────── Feature data ────────────────────────────────────
const features = [
  { icon: BarChart3, color: 'text-[#00ff88]', bg: 'bg-[#00ff88]/10', title: 'Deep Analytics', desc: 'Track win rate, profit factor, R-multiple, equity curve, and 20+ performance metrics in real time.' },
  { icon: Wallet, color: 'text-[#3b82f6]', bg: 'bg-[#3b82f6]/10', title: 'Multi-Account Manager', desc: 'Manage live accounts, paper trading, and funded challenge accounts — each with its own stats.' },
  { icon: Layers, color: 'text-[#a78bfa]', bg: 'bg-[#a78bfa]/10', title: 'Custom Log Templates', desc: 'Build templates with text, checkboxes, long-form notes, and screenshot uploads. Assign per account.' },
  { icon: Calendar, color: 'text-[#ffd93d]', bg: 'bg-[#ffd93d]/10', title: 'Trade Calendar', desc: 'Visualise your daily P&L on a heatmap calendar to spot patterns and high-performance days instantly.' },
  { icon: Camera, color: 'text-[#ff4757]', bg: 'bg-[#ff4757]/10', title: 'Screenshot Storage', desc: 'Attach chart screenshots to any trade via Amazon S3. Review your setup execution side-by-side.' },
  { icon: Shield, color: 'text-[#00ff88]', bg: 'bg-[#00ff88]/10', title: 'Secure & Private', desc: 'OTP email authentication, encrypted storage, and no third-party data sharing — ever.' },
];

const steps = [
  { n: '01', icon: BookOpen, title: 'Create Your Account', body: 'Sign up with your email in seconds — no password, no credit card. A one-time OTP keeps your account secure every time you log in.' },
  { n: '02', icon: Wallet, title: 'Set Up Trading Accounts', body: 'Add all your brokerage, paper, or funded accounts. Set currency, initial balance, and any custom rules per account.' },
  { n: '03', icon: FileText, title: 'Log Every Trade', body: 'Enter symbol, direction, quantity, entry/exit, and any notes. Attach screenshots. Use custom templates to capture strategy-specific data.' },
  { n: '04', icon: PieChart, title: 'Analyse & Improve', body: 'Open the Analytics dashboard to see win rate, profit factor, best setups, worst mistakes, and an equity curve that never lies.' },
];

const useCases = [
  { icon: TrendingUp, label: 'Day Traders', desc: 'High-frequency intraday logging with time-of-day performance breakdown.' },
  { icon: LineChart, label: 'Swing Traders', desc: 'Multi-day position tracking with R-multiple and holding-period analysis.' },
  { icon: Globe, label: 'Forex Traders', desc: 'Pip-based P&L, currency pair performance, and session analysis.' },
  { icon: Activity, label: 'Crypto Traders', desc: 'Track volatile digital assets with spot and perpetual futures support.' },
  { icon: Tag, label: 'Options Traders', desc: 'Log premium, strike, expiry, and IV to analyse strategy edge over time.' },
  { icon: Award, label: 'Funded Traders', desc: 'Monitor drawdown and daily loss limits to stay inside FTMO/Prop-firm rules.' },
];

const faqs: { q: string; a: string }[] = [
  { q: 'What is a trading journal and why do I need one?', a: 'A trading journal is a systematic record of your trades, emotions, strategy notes, and outcomes. Research consistently shows that traders who journal perform significantly better over time — they identify edge, eliminate repeating mistakes, and build the discipline needed for consistent profitability.' },
  { q: 'What should I track in my trading journal?', a: 'At minimum: instrument, direction (long/short), entry price, exit price, position size, and net P&L. Advanced traders also record: setup type, risk/reward ratio, market conditions, emotional state, screenshots of entry/exit, and adherence to their trading plan. Trade Journal\'s custom templates let you capture all of this.' },
  { q: 'Is Trade Journal free to use?', a: 'Yes — completely free. Create an account with just your email address and start logging trades immediately. No subscription, no credit card, no hidden fees.' },
  { q: 'Does Trade Journal work for forex, stocks, crypto, and options?', a: 'Yes. Trade Journal is instrument-agnostic. Log trades for any market — equities, ETFs, futures, forex pairs, cryptocurrencies, and options contracts. You can manage separate accounts per market so analytics stay clean.' },
  { q: 'Can I use Trade Journal for funded account challenges (FTMO, MyFundedFX, etc.)?', a: 'Absolutely. Create a dedicated account for each funded programme. Track your current drawdown and daily loss in real-time so you never accidentally breach the rules of your challenge.' },
  { q: 'What analytics and performance metrics does Trade Journal calculate?', a: 'Trade Journal tracks: win rate %, profit factor, total net P&L, gross profit & loss, average winner vs average loser, R-multiple, maximum drawdown, Sharpe approximation, best/worst trade, performance by symbol, and equity curve over selectable time ranges.' },
  { q: 'How do custom log templates work?', a: 'You create a template with any combination of fields: short text, long-form notes, checkboxes, and image uploads. You then assign that template to one or more of your trading accounts. Every time you log a trade on that account, the extra template fields appear automatically — none are mandatory.' },
  { q: 'How does Trade Journal handle chart screenshots?', a: 'Use the image field type in a custom log template. When logging a trade, click Upload Image to attach a chart screenshot. Images are stored securely in Amazon S3 and displayed inline when reviewing that trade.' },
  { q: 'Is my trading data private and secure?', a: 'Yes. All data is stored in an encrypted database. Access is protected by OTP email authentication. We do not sell, share, or analyse your personal trading data with any third party.' },
  { q: 'How do I start improving my win rate with Trade Journal?', a: 'Use the Analytics dashboard to identify which setups, sessions, and instruments produce positive expectancy. Filter losing trades to find common mistakes. Over weeks and months, your equity curve and profit factor will reveal whether your edge is improving — objectively, without guesswork.' },
];

// ────────────────────────────── Page ─────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#0a0e14] text-[#c9d1d9] overflow-x-hidden">

        {/* ── NAVIGATION ── */}
        <nav className="sticky top-0 z-50 bg-[#0a0e14]/90 backdrop-blur-md border-b border-[#1e2936]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group" aria-label="Trade Journal home">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00ff88] to-[#00cc6a] flex items-center justify-center shadow-[0_0_12px_rgba(0,255,136,0.3)]">
                <TrendingUp className="w-4.5 h-4.5 text-[#0a0e14]" />
              </div>
              <span className="text-[#c9d1d9] font-bold text-lg tracking-tight group-hover:text-[#00ff88] transition-colors">
                Trade<span className="text-[#00ff88]">Journal</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-sm text-[#8b92a8]">
              <a href="#features" className="hover:text-[#00ff88] transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-[#00ff88] transition-colors">How It Works</a>
              <a href="#use-cases" className="hover:text-[#00ff88] transition-colors">Who It&apos;s For</a>
              <a href="#faq" className="hover:text-[#00ff88] transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
              <Link href="/login" className="text-sm text-[#8b92a8] hover:text-[#c9d1d9] transition-colors hidden sm:block">
                Sign In
              </Link>
              <LandingCTAButton size="sm" compactOnMobile />
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="relative pt-24 pb-20 px-4 sm:px-6 overflow-hidden" aria-label="Hero">
          {/* Background glows */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div className="absolute w-[800px] h-[800px] bg-[#00ff88] opacity-[0.025] rounded-full blur-[160px] -top-80 left-1/2 -translate-x-1/2" />
            <div className="absolute w-[400px] h-[400px] bg-[#3b82f6] opacity-[0.03] rounded-full blur-[120px] bottom-0 right-0" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/25 rounded-full text-[#00ff88] text-xs font-semibold tracking-wide uppercase mb-8">
              <Star className="w-3.5 h-3.5 fill-current" />
              Free for all traders — no credit card needed
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#c9d1d9] leading-[1.1] tracking-tight mb-6">
              The Professional Trading Journal
              <br />
              <span className="bg-gradient-to-r from-[#00ff88] to-[#3b82f6] bg-clip-text text-transparent">
                Built for Serious Traders
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-[#8b92a8] max-w-2xl mx-auto mb-10 leading-relaxed">
              Log every trade, measure what matters, and let data expose both your edge <em>and</em> your blind spots.
              Used by stock, forex, crypto, options, and funded-account traders worldwide.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              <LandingCTAButton size="lg" />
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold border border-[#1e2936] text-[#8b92a8] hover:border-[#00ff88]/40 hover:text-[#00ff88] rounded-xl transition-all"
              >
                See How It Works
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Dashboard mockup */}
            <div className="relative mx-auto max-w-3xl rounded-2xl border border-[#1e2936] bg-[#111822] shadow-[0_0_80px_rgba(0,255,136,0.06)] overflow-hidden">
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[#1e2936] bg-[#0d1520]">
                <span className="w-3 h-3 rounded-full bg-[#ff4757]" />
                <span className="w-3 h-3 rounded-full bg-[#ffd93d]" />
                <span className="w-3 h-3 rounded-full bg-[#00ff88]" />
                <span className="ml-4 text-xs text-[#8b92a8] font-mono">tradejournal.app/dashboard</span>
              </div>
              <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                {[
                  { label: 'Win Rate', value: '68.4 %', sub: '+3.2% this month', color: 'text-[#00ff88]' },
                  { label: 'Profit Factor', value: '2.14', sub: 'Last 30 trades', color: 'text-[#3b82f6]' },
                  { label: 'Net P&L', value: '+$4,820', sub: 'All accounts', color: 'text-[#00ff88]' },
                  { label: 'Open Trades', value: '3', sub: 'Active positions', color: 'text-[#ffd93d]' },
                ].map((s) => (
                  <div key={s.label} className="bg-[#0d1520] rounded-xl p-4 border border-[#1e2936]">
                    <p className="text-[10px] text-[#8b92a8] mb-1 uppercase tracking-wider">{s.label}</p>
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] text-[#8b92a8] mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { sym: 'EUR/USD', dir: 'LONG', pnl: '+$320', color: 'text-[#00ff88]' },
                  { sym: 'AAPL', dir: 'SHORT', pnl: '-$85', color: 'text-[#ff4757]' },
                  { sym: 'BTC/USDT', dir: 'LONG', pnl: '+$1,240', color: 'text-[#00ff88]' },
                ].map((r) => (
                  <div key={r.sym} className="flex items-center justify-between bg-[#0d1520] rounded-lg px-4 py-2.5 border border-[#1e2936]">
                    <div>
                      <p className="text-sm font-semibold text-[#c9d1d9]">{r.sym}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e2936] text-[#8b92a8]">{r.dir}</span>
                    </div>
                    <p className={`text-sm font-bold ${r.color}`}>{r.pnl}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <section className="py-12 border-y border-[#1e2936] bg-[#0d1520]" aria-label="Platform stats">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10,000+', label: 'Active Traders' },
              { value: '2 M+', label: 'Trades Logged' },
              { value: '98 %', label: 'Uptime SLA' },
              { value: '4.9 / 5', label: 'Average Rating' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-[#00ff88] mb-1">{s.value}</p>
                <p className="text-sm text-[#8b92a8]">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="py-24 px-4 sm:px-6" aria-labelledby="features-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[#00ff88] text-sm font-semibold tracking-widest uppercase mb-3">Everything You Need</p>
              <h2 id="features-heading" className="text-3xl sm:text-4xl font-extrabold text-[#c9d1d9] mb-4">
                A complete trading journal platform
              </h2>
              <p className="text-[#8b92a8] max-w-xl mx-auto">
                Every feature is designed around one goal: helping you understand your trading performance
                clearly and act on it decisively.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <article key={f.title} className="bg-[#111822] border border-[#1e2936] rounded-2xl p-6 hover:border-[#00ff88]/30 transition-all group">
                  <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <f.icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="text-base font-bold text-[#c9d1d9] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#8b92a8] leading-relaxed">{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-24 px-4 sm:px-6 bg-[#0d1520]" aria-labelledby="hiw-heading">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-[#3b82f6] text-sm font-semibold tracking-widest uppercase mb-3">Get Started in Minutes</p>
              <h2 id="hiw-heading" className="text-3xl sm:text-4xl font-extrabold text-[#c9d1d9] mb-4">
                How Trade Journal works
              </h2>
              <p className="text-[#8b92a8] max-w-xl mx-auto">
                From sign-up to your first analytics insight in under five minutes.
              </p>
            </div>

            <div className="relative grid md:grid-cols-4 gap-8">
              {/* connector line */}
              <div aria-hidden="true" className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[#00ff88]/30 to-transparent" />

              {steps.map((s) => (
                <article key={s.n} className="flex flex-col items-center text-center">
                  <div className="relative mb-5">
                    <div className="w-24 h-24 rounded-2xl bg-[#111822] border border-[#1e2936] flex items-center justify-center shadow-[0_0_24px_rgba(0,255,136,0.06)]">
                      <s.icon className="w-9 h-9 text-[#00ff88]" />
                    </div>
                    <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-[#00ff88] text-[#0a0e14] text-[10px] font-black flex items-center justify-center">
                      {s.n.slice(-1)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#c9d1d9] mb-2">{s.title}</h3>
                  <p className="text-sm text-[#8b92a8] leading-relaxed">{s.body}</p>
                </article>
              ))}
            </div>

            <div className="flex justify-center mt-14">
              <LandingCTAButton size="lg" />
            </div>
          </div>
        </section>

        {/* ── ANALYTICS DEEP DIVE ── */}
        <section className="py-24 px-4 sm:px-6" aria-labelledby="analytics-heading">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Text */}
              <div>
                <p className="text-[#00ff88] text-sm font-semibold tracking-widest uppercase mb-3">Analytics</p>
                <h2 id="analytics-heading" className="text-3xl sm:text-4xl font-extrabold text-[#c9d1d9] mb-6 leading-tight">
                  Performance metrics that actually drive improvement
                </h2>
                <p className="text-[#8b92a8] mb-8 leading-relaxed">
                  Move beyond &ldquo;I think I&apos;m profitable.&rdquo; See your exact win rate, how much you make on winners versus
                  losers, which symbols produce your edge, and when your worst trades cluster — all updated live.
                </p>
                <ul className="space-y-3">
                  {[
                    'Win Rate % & Loss Rate breakdown', 'Profit Factor (gross profit ÷ gross loss)',
                    'Average R-Multiple & expectancy', 'Equity curve with drawdown overlay',
                    'Performance by symbol, session & setup', 'Best day / worst day heatmap calendar',
                    'Streak analysis — wins, losses, breakevens', 'Filtered views by account or date range',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[#8b92a8]">
                      <CheckCircle className="w-4.5 h-4.5 text-[#00ff88] flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual */}
              <div className="bg-[#111822] rounded-2xl border border-[#1e2936] p-6 shadow-[0_0_60px_rgba(0,255,136,0.04)]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-[#c9d1d9]">Equity Curve — Last 30 Trades</h3>
                  <span className="text-xs px-2 py-1 rounded bg-[#00ff88]/10 text-[#00ff88] font-mono">+$4,820</span>
                </div>
                {/* SVG chart mockup */}
                <svg viewBox="0 0 380 120" className="w-full h-32 mb-6" aria-label="Equity curve chart showing upward trend">
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00ff88" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,100 L20,92 L40,95 L60,80 L80,75 L100,82 L120,68 L140,72 L160,55 L180,48 L200,60 L220,42 L240,38 L260,45 L280,30 L300,22 L320,28 L340,15 L360,10 L380,8" stroke="#00ff88" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M0,100 L20,92 L40,95 L60,80 L80,75 L100,82 L120,68 L140,72 L160,55 L180,48 L200,60 L220,42 L240,38 L260,45 L280,30 L300,22 L320,28 L340,15 L360,10 L380,8 L380,120 L0,120 Z" fill="url(#g1)" />
                </svg>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Win Rate', val: '68.4%', up: true },
                    { label: 'Profit Factor', val: '2.14', up: true },
                    { label: 'Max Drawdown', val: '4.2%', up: false },
                  ].map((m) => (
                    <div key={m.label} className="text-center bg-[#0d1520] rounded-xl p-3 border border-[#1e2936]">
                      <p className={`text-lg font-bold ${m.up ? 'text-[#00ff88]' : 'text-[#ff4757]'}`}>{m.val}</p>
                      <p className="text-[10px] text-[#8b92a8] mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CUSTOM TEMPLATES ── */}
        <section className="py-24 px-4 sm:px-6 bg-[#0d1520]" aria-labelledby="templates-heading">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Visual */}
              <div className="order-2 lg:order-1 bg-[#111822] rounded-2xl border border-[#1e2936] p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Layers className="w-5 h-5 text-[#a78bfa]" />
                  <h3 className="text-sm font-semibold text-[#c9d1d9]">Forex Setup Template</h3>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#00ff88]/10 text-[#00ff88]">Active</span>
                </div>
                <div className="space-y-3">
                  {[
                    { type: 'TEXT', label: 'Setup Type', placeholder: 'e.g. London Breakout' },
                    { type: 'CHECKBOX', label: 'Followed Trading Plan', placeholder: '' },
                    { type: 'LONG_TEXT', label: 'Pre-Trade Analysis', placeholder: 'Market structure, confluence...' },
                    { type: 'IMAGE', label: 'Entry Screenshot', placeholder: '' },
                  ].map((f) => (
                    <div key={f.label} className="bg-[#0d1520] border border-[#1e2936] rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-[#c9d1d9]">{f.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                          f.type === 'IMAGE' ? 'bg-[#ff4757]/10 text-[#ff4757]' :
                          f.type === 'CHECKBOX' ? 'bg-[#00ff88]/10 text-[#00ff88]' :
                          f.type === 'LONG_TEXT' ? 'bg-[#a78bfa]/10 text-[#a78bfa]' :
                          'bg-[#3b82f6]/10 text-[#3b82f6]'
                        }`}>{f.type}</span>
                      </div>
                      {f.type === 'CHECKBOX' ? (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-4 h-4 rounded border border-[#00ff88] bg-[#00ff88]/20 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-[#00ff88]" />
                          </div>
                          <span className="text-xs text-[#8b92a8]">Yes</span>
                        </div>
                      ) : f.type === 'IMAGE' ? (
                        <div className="border border-dashed border-[#1e2936] rounded-lg h-10 flex items-center justify-center mt-1">
                          <Camera className="w-4 h-4 text-[#8b92a8]" />
                          <span className="text-xs text-[#8b92a8] ml-2">Upload chart screenshot</span>
                        </div>
                      ) : (
                        <div className="text-xs text-[#8b92a8]/50 italic mt-1">{f.placeholder}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2">
                <p className="text-[#a78bfa] text-sm font-semibold tracking-widest uppercase mb-3">Custom Templates</p>
                <h2 id="templates-heading" className="text-3xl sm:text-4xl font-extrabold text-[#c9d1d9] mb-6 leading-tight">
                  Your journal, your fields
                </h2>
                <p className="text-[#8b92a8] mb-8 leading-relaxed">
                  Every trading strategy is different. Custom log templates let you capture the exact information
                  relevant to your approach — directly inside each trade entry.
                </p>
                <ul className="space-y-4">
                  {[
                    { icon: FileText, c: 'text-[#3b82f6]', t: 'Short text fields', d: 'Quick labels like setup type, session, confluence count.' },
                    { icon: BookOpen, c: 'text-[#a78bfa]', t: 'Long-form note fields', d: 'Document full pre-trade analysis and post-trade review.' },
                    { icon: CheckCircle, c: 'text-[#00ff88]', t: 'Checkbox fields', d: 'Enforce rules — "Did I follow my plan? Was risk defined?"' },
                    { icon: Camera, c: 'text-[#ff4757]', t: 'Image upload fields', d: 'Attach entry/exit chart screenshots stored in S3.' },
                  ].map((item) => (
                    <li key={item.t} className="flex items-start gap-4">
                      <div className={`w-9 h-9 rounded-lg bg-[#111822] border border-[#1e2936] flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`w-4 h-4 ${item.c}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#c9d1d9]">{item.t}</p>
                        <p className="text-xs text-[#8b92a8] mt-0.5">{item.d}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── USE CASES ── */}
        <section id="use-cases" className="py-24 px-4 sm:px-6" aria-labelledby="usecases-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[#ffd93d] text-sm font-semibold tracking-widest uppercase mb-3">Who It&apos;s For</p>
              <h2 id="usecases-heading" className="text-3xl sm:text-4xl font-extrabold text-[#c9d1d9] mb-4">
                Built for every type of trader
              </h2>
              <p className="text-[#8b92a8] max-w-xl mx-auto">
                Whether you trade equities before the open bell or Bitcoin at midnight, Trade Journal adapts to your workflow.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {useCases.map((u) => (
                <article key={u.label} className="flex items-start gap-4 bg-[#111822] border border-[#1e2936] rounded-2xl p-5 hover:border-[#ffd93d]/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-[#ffd93d]/10 flex items-center justify-center flex-shrink-0">
                    <u.icon className="w-5 h-5 text-[#ffd93d]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#c9d1d9] mb-1">{u.label}</h3>
                    <p className="text-xs text-[#8b92a8] leading-relaxed">{u.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURE CHECKLIST ── */}
        <section className="py-24 px-4 sm:px-6 bg-[#0d1520]" aria-labelledby="checklist-heading">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[#3b82f6] text-sm font-semibold tracking-widest uppercase mb-3">Full Feature List</p>
              <h2 id="checklist-heading" className="text-3xl sm:text-4xl font-extrabold text-[#c9d1d9] mb-4">
                Everything included. Nothing locked away.
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4">
              {[
                'Unlimited trade entries', 'Multi-account management',
                'Advanced analytics dashboard', 'Win rate & profit factor',
                'Equity curve visualisation', 'Trade calendar heatmap',
                'Custom log templates', 'Short text & long-form note fields',
                'Checkbox fields for rule enforcement', 'Image upload via Amazon S3',
                'Open & closed trade tracking', 'P&L in any currency',
                'Advanced search & filtering', 'Mobile-responsive UI',
                'OTP email authentication', 'Encrypted data storage',
                'No ads, no data selling', 'Free — always',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 py-2 border-b border-[#1e2936]/60">
                  <CheckCircle className="w-4 h-4 text-[#00ff88] flex-shrink-0" />
                  <span className="text-sm text-[#8b92a8]">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-14 text-center">
              <LandingCTAButton size="lg" />
              <p className="text-xs text-[#8b92a8]/60 mt-4">No credit card · No setup fee · 100% free</p>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-24 px-4 sm:px-6" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[#00ff88] text-sm font-semibold tracking-widest uppercase mb-3">Frequently Asked</p>
              <h2 id="faq-heading" className="text-3xl sm:text-4xl font-extrabold text-[#c9d1d9] mb-4">
                Common questions about trading journals
              </h2>
              <p className="text-[#8b92a8]">
                Everything you need to know about journaling your trades and improving performance.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.q}
                  className="group bg-[#111822] border border-[#1e2936] rounded-2xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 cursor-pointer px-6 py-5 list-none">
                    <h3 className="text-sm font-semibold text-[#c9d1d9] text-left">{faq.q}</h3>
                    <ChevronRight className="w-4 h-4 text-[#8b92a8] flex-shrink-0 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-6 pb-5">
                    <p className="text-sm text-[#8b92a8] leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-28 px-4 sm:px-6 relative overflow-hidden" aria-labelledby="cta-heading">
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            <div className="absolute w-[600px] h-[600px] bg-[#00ff88] opacity-[0.04] rounded-full blur-[140px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="max-w-2xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/25 rounded-full text-[#00ff88] text-xs font-semibold mb-8 uppercase tracking-wide">
              <Zap className="w-3.5 h-3.5" />
              Start improving today — free forever
            </div>
            <h2 id="cta-heading" className="text-4xl sm:text-5xl font-extrabold text-[#c9d1d9] mb-6 leading-tight">
              Ready to trade with{' '}
              <span className="bg-gradient-to-r from-[#00ff88] to-[#3b82f6] bg-clip-text text-transparent">
                clarity and edge?
              </span>
            </h2>
            <p className="text-lg text-[#8b92a8] mb-10 leading-relaxed">
              Join thousands of traders who use Trade Journal to stay disciplined, spot their real edge,
              and grow their accounts consistently — starting with their very next trade.
            </p>
            <LandingCTAButton size="lg" />
            <p className="text-xs text-[#8b92a8]/50 mt-6">
              No credit card &bull; No limits &bull; Works for stocks, forex, crypto &amp; options
            </p>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-[#1e2936] bg-[#0d1520] py-12 px-4 sm:px-6" role="contentinfo">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
              <div>
                <Link href="/" className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00ff88] to-[#00cc6a] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#0a0e14]" />
                  </div>
                  <span className="font-bold text-[#c9d1d9]">Trade<span className="text-[#00ff88]">Journal</span></span>
                </Link>
                <p className="text-xs text-[#8b92a8] leading-relaxed">
                  The professional trading journal for serious traders. Log smarter, analyse deeper, improve faster.
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#c9d1d9] uppercase tracking-wider mb-4">Product</h4>
                <ul className="space-y-2.5 text-xs text-[#8b92a8]">
                  <li><a href="#features" className="hover:text-[#00ff88] transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-[#00ff88] transition-colors">How It Works</a></li>
                  <li><a href="#use-cases" className="hover:text-[#00ff88] transition-colors">Who It&apos;s For</a></li>
                  <li><a href="#faq" className="hover:text-[#00ff88] transition-colors">FAQ</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#c9d1d9] uppercase tracking-wider mb-4">Trader Types</h4>
                <ul className="space-y-2.5 text-xs text-[#8b92a8]">
                  <li><span>Day Traders</span></li>
                  <li><span>Swing Traders</span></li>
                  <li><span>Forex Traders</span></li>
                  <li><span>Funded / Prop Traders</span></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#c9d1d9] uppercase tracking-wider mb-4">Account</h4>
                <ul className="space-y-2.5 text-xs text-[#8b92a8]">
                  <li><Link href="/login" className="hover:text-[#00ff88] transition-colors">Sign In</Link></li>
                  <li><Link href="/login" className="hover:text-[#00ff88] transition-colors">Create Account</Link></li>
                  <li><Link href="/dashboard" className="hover:text-[#00ff88] transition-colors">Dashboard</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-[#1e2936] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-[#8b92a8]">
                &copy; {new Date().getFullYear()} Trade Journal. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-xs text-[#8b92a8]">
                <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Encrypted</span>
                <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> Private</span>
                <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> Free Forever</span>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
