import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface PreviewLayoutProps {
  children: React.ReactNode;
  branding?: {
    logo_url?: string;
  };
}

export function PreviewLayout({ children, branding }: PreviewLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isOnboard = pathname?.startsWith('/onboard');

  return (
    <div className="min-h-screen flex flex-col bg-white pt-24">
      {branding?.logo_url && (
        <div
          style={{ position: 'fixed', top: '2.5rem', left: '8rem', zIndex: 40 }}
          className="flex items-center"
        >
          <img
            src={branding.logo_url}
            alt="Logo"
            className="h-12 w-auto max-w-[180px] object-contain"
            style={{ display: 'block' }}
          />
        </div>
      )}
      {children}
    </div>
  );
} 