import Link from 'next/link';
import Image from 'next/image';
import { Play, Tv, Smartphone, Monitor, Star } from 'lucide-react';
import { SupabaseErrorRedirect } from '@/components/auth/supabase-error-redirect';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <SupabaseErrorRedirect />

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-5 py-4 md:px-12">
        <Image
          src="/keba-logo.jpg"
          alt="Keba Entertainmentz"
          width={56}
          height={56}
          className="rounded-sm object-contain"
          priority
        />
        <div className="flex gap-3">
          <Link href="/auth/login" className="btn-ghost text-sm">Sign In</Link>
          <Link href="/auth/register" className="btn-primary text-sm py-2 px-5">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-5 py-24 text-center md:py-40">
        {/* Glow layers */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(37,99,235,0.18),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-dark-950/0 via-dark-950/60 to-dark-950" />

        <div className="relative z-10 mx-auto max-w-3xl">
          {/* Logo badge */}
          <div className="mb-6 flex justify-center">
            <Image
              src="/keba-logo.jpg"
              alt="Keba Entertainmentz"
              width={96}
              height={96}
              className="rounded-xl object-contain shadow-[0_0_40px_rgba(37,99,235,0.4)]"
              priority
            />
          </div>

          <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            African Stories.{' '}
            <span className="bg-gradient-to-r from-primary-400 to-keba-red bg-clip-text text-transparent">
              World Class Entertainment.
            </span>
          </h1>

          <p className="mb-10 text-base text-dark-300 md:text-xl">
            Stream original African series and movies, anytime, anywhere — only on Keba Entertainmentz.
          </p>

          <Link
            href="/auth/register"
            className="btn-primary inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-bold shadow-lg shadow-primary-600/30"
          >
            <Play className="h-5 w-5" fill="white" /> Start Watching Free
          </Link>

          <p className="mt-4 text-xs text-dark-500">Sign up in seconds. Cancel anytime.</p>
        </div>
      </section>

      {/* ── Featured badge row ── */}
      <section className="mx-auto max-w-5xl px-5 pb-16">
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-dark-400">
          {['Drama', 'Thriller', 'Romance', 'Comedy', 'Action', 'Melodrama'].map((g) => (
            <span
              key={g}
              className="rounded-full border border-dark-700 bg-dark-900 px-4 py-1.5 text-dark-300"
            >
              {g}
            </span>
          ))}
        </div>
      </section>

      {/* ── Why Keba ── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">Why Keba Entertainmentz?</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Star,
              title: 'Original African Content',
              desc: 'Exclusive series and movies produced right here in Africa — stories that speak to you.',
            },
            {
              icon: Tv,
              title: 'Watch on Any Screen',
              desc: 'Phone, tablet, laptop or Smart TV — your entertainment goes wherever you do.',
            },
            {
              icon: Play,
              title: 'New Episodes Weekly',
              desc: 'Fresh content drops every week so there\'s always something new to watch.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="card p-8 text-center transition-all duration-300 hover:border-primary-700 hover:shadow-lg hover:shadow-primary-900/20"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600/10">
                <Icon className="h-7 w-7 text-primary-400" />
              </div>
              <h3 className="mb-2 text-lg font-bold">{title}</h3>
              <p className="text-sm text-dark-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Device icons ── */}
      <section className="bg-dark-900/60 px-5 py-16 text-center">
        <h2 className="mb-2 text-2xl font-bold md:text-3xl">Available on all your devices</h2>
        <p className="mb-10 text-dark-400">Install as an app — no download needed.</p>
        <div className="flex flex-wrap items-center justify-center gap-10 text-dark-400">
          {[
            { icon: Smartphone, label: 'Mobile' },
            { icon: Monitor, label: 'Desktop' },
            { icon: Tv, label: 'Smart TV' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Icon className="h-14 w-14 text-dark-300" />
              <span className="text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-5 py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to start watching?</h2>
        <p className="mb-8 text-dark-300">
          Join Keba Entertainmentz today and stream the best of African storytelling.
        </p>
        <Link
          href="/auth/register"
          className="btn-primary inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-bold shadow-lg shadow-primary-600/30"
        >
          Create Free Account
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-dark-800 px-5 py-8 text-center text-sm text-dark-500">
        <p className="mb-2">
          <Image src="/keba-logo.jpg" alt="Keba" width={28} height={28} className="mx-auto mb-2 rounded-sm object-contain" />
        </p>
        &copy; {new Date().getFullYear()} Keba Entertainmentz. All rights reserved.
      </footer>
    </div>
  );
}
