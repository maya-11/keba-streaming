'use client';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-dark-600 border-t-primary-500`} />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-950">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-dark-400">Loading...</p>
      </div>
    </div>
  );
}
