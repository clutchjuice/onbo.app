import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PreviewLayoutProps {
  children: React.ReactNode;
}

export function PreviewLayout({ children }: PreviewLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="fixed top-4 left-4 z-50">
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50 border-gray-200"
        >
          Exit Preview
        </Button>
      </div>
      {children}
    </div>
  );
} 