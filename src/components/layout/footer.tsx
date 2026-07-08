import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-dark-800 bg-dark-950 px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase text-dark-400">Browse</h3>
            <ul className="space-y-2">
              <li><Link href="/browse/movies" className="text-sm text-dark-300 hover:text-white">Movies</Link></li>
              <li><Link href="/browse/series" className="text-sm text-dark-300 hover:text-white">Series</Link></li>
              <li><Link href="/browse" className="text-sm text-dark-300 hover:text-white">New Releases</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase text-dark-400">Account</h3>
            <ul className="space-y-2">
              <li><Link href="/profile" className="text-sm text-dark-300 hover:text-white">Profile</Link></li>
              <li><Link href="/profile/subscription" className="text-sm text-dark-300 hover:text-white">Subscription</Link></li>
              <li><Link href="/my-list" className="text-sm text-dark-300 hover:text-white">My List</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase text-dark-400">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/help" className="text-sm text-dark-300 hover:text-white">Help Center</Link></li>
              <li><Link href="/terms" className="text-sm text-dark-300 hover:text-white">Terms of Use</Link></li>
              <li><Link href="/privacy" className="text-sm text-dark-300 hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase text-dark-400">About</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-dark-300 hover:text-white">About Keba</Link></li>
              <li><Link href="/contact" className="text-sm text-dark-300 hover:text-white">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-dark-800 pt-8 text-center">
          <p className="text-sm text-dark-500">&copy; {new Date().getFullYear()} Keba Streaming. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
