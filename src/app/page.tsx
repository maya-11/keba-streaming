import Link from 'next/link';
import { Play, Download, Monitor, Smartphone, Tv, Shield } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      <nav className="flex items-center justify-between px-4 py-4 md:px-8">
        <span className="text-3xl font-bold text-primary-500">KEBA</span>
        <div className="flex gap-3">
          <Link href="/auth/login" className="btn-ghost">Sign In</Link>
          <Link href="/auth/register" className="btn-primary text-sm">Get Started</Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 py-20 text-center md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/20 to-dark-950" />
        <div className="relative mx-auto max-w-4xl">
          <h1 className="mb-6 text-4xl font-bold md:text-6xl lg:text-7xl">
            Unlimited movies, series, and more
          </h1>
          <p className="mb-8 text-lg text-dark-300 md:text-xl">
            Watch anywhere. Cancel anytime. Starting at $4.99/month.
          </p>
          <Link href="/auth/register" className="btn-primary inline-flex items-center gap-2 text-lg">
            <Play className="h-5 w-5" fill="white" /> Start Watching
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { icon: Monitor, title: 'Watch Everywhere', desc: 'Stream on your phone, tablet, laptop, or TV with no extra fees.' },
            { icon: Download, title: 'Download & Go', desc: 'Save your favourites and watch offline wherever you are.' },
            { icon: Shield, title: 'Plans for Everyone', desc: 'Choose a plan that fits your budget. Upgrade or cancel anytime.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card p-8 text-center">
              <Icon className="mx-auto mb-4 h-12 w-12 text-primary-500" />
              <h3 className="mb-2 text-xl font-bold">{title}</h3>
              <p className="text-dark-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Watch on Any Device</h2>
        <div className="flex flex-wrap items-center justify-center gap-8 text-dark-400">
          {[
            { icon: Smartphone, label: 'Phone' },
            { icon: Monitor, label: 'Laptop' },
            { icon: Tv, label: 'Smart TV' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon className="h-16 w-16" />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-dark-900 px-4 py-16 text-center">
        <h2 className="mb-4 text-3xl font-bold">Ready to watch?</h2>
        <p className="mb-8 text-dark-300">Create an account and start streaming today.</p>
        <Link href="/auth/register" className="btn-primary inline-flex items-center gap-2 text-lg">
          Get Started
        </Link>
      </section>

      <footer className="border-t border-dark-800 px-4 py-8 text-center text-sm text-dark-500">
        &copy; {new Date().getFullYear()} Keba Streaming. All rights reserved.
      </footer>
    </div>
  );
}
