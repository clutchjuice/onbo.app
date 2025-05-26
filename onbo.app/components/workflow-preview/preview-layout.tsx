import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen flex flex-col bg-white">
      {branding?.logo_url && (
        <div className="fixed top-4 left-4 z-50 flex items-center">
          <img
            src={branding.logo_url}
            alt="Logo"
            className="h-10 w-auto max-w-[160px] object-contain rounded-md shadow bg-white/80 border border-gray-200 p-1"
            style={{ background: 'white' }}
          />
        </div>
      )}
      {!isOnboard && (
        <div className="fixed top-4 left-4 z-50">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50 border-gray-200"
          >
            Exit Preview
          </Button>
        </div>
      )}
      {children}
    </div>
  );
} 