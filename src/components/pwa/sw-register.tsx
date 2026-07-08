'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        // When a new SW is waiting, activate it immediately
        reg.addEventListener('updatefound', () => {
          const incoming = reg.installing;
          if (!incoming) return;
          incoming.addEventListener('statechange', () => {
            if (incoming.state === 'installed' && navigator.serviceWorker.controller) {
              // New SW installed — tell it to skip waiting so users get the update
              incoming.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });
      } catch (err) {
        console.error('[SW] Registration failed:', err);
      }
    };

    // Delay registration until after the page is interactive
    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
