import { Button } from '@/components/ui/button';

interface NavigationControlsProps {
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLastStep: boolean;
}

export function NavigationControls({
  onNext,
  onBack,
  canGoBack,
  isLastStep
}: NavigationControlsProps) {
  return (
    <div className="mt-4 flex items-center justify-center gap-4 pb-8">
      {canGoBack && (
        <Button
          onClick={onBack}
          variant="outline"
          className="text-gray-500 hover:text-gray-700 px-8 py-3 rounded-full text-base font-medium
            transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md
            active:scale-95"
        >
          Back
        </Button>
      )}
      <Button
        onClick={onNext}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-base font-medium
          transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md
          active:scale-95"
      >
        {isLastStep ? 'Complete' : 'Next'}
      </Button>
    </div>
  );
} 