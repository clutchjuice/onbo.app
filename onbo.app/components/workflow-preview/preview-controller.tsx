import { useState, useCallback, useEffect } from 'react';
import { StepRenderer } from '@/components/workflow-preview/step-renderer';
import { NavigationControls } from '@/components/workflow-preview/navigation-controls';
import { StepProgress } from '@/components/workflow-preview/step-progress';
import { toast } from 'sonner';

interface PreviewControllerProps {
  workflow: {
    id: string;
    steps: any[];
    flow_behavior: {
      allow_back_navigation: boolean;
      show_progress_indicator: boolean;
    };
  };
}

export function PreviewController({ workflow }: PreviewControllerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepResponses, setStepResponses] = useState<Record<string, any>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const currentStep = workflow.steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === workflow.steps.length - 1;

  // Add initial animation effect
  useEffect(() => {
    // Start with 0% width
    setShowProgress(false);
    // Then animate to the first step's progress
    const timer = setTimeout(() => {
      setShowProgress(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Handle auto-advance events
  useEffect(() => {
    const handleAutoAdvance = () => {
      // Simply move to the next step, don't skip
      if (isLastStep) {
        setIsComplete(true);
      } else {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    };

    window.addEventListener('autoAdvance', handleAutoAdvance);
    return () => {
      window.removeEventListener('autoAdvance', handleAutoAdvance);
    };
  }, [isLastStep, currentStepIndex]);

  const handleNext = useCallback(() => {
    // For form steps, only validate if it's a form type
    if (currentStep.type === 'form') {
      const response = stepResponses[currentStep.id] || {};
      const requiredFields = currentStep.data?.fields?.filter((f: any) => f.required) || [];
      
      // If there are no required fields, allow proceeding
      if (requiredFields.length === 0) {
        if (isLastStep) {
          setIsComplete(true);
          return;
        }
        setCurrentStepIndex(prev => prev + 1);
        return;
      }

      // Trigger form validation in the FormStep component
      window.dispatchEvent(new Event('formSubmitAttempt'));

      // Check if all required fields are filled
      const missingFields = requiredFields.filter((field: any) => {
        const value = response[field.id];
        
        // Special handling for different field types
        if (field.type === 'checkbox') {
          return value === undefined;
        }
        if (field.type === 'select' && field.displayStyle === 'card') {
          return !value || value === '';
        }
        return value === undefined || value === null || value === '';
      });

      if (missingFields.length > 0) {
        // Don't show error here, let the FormStep component handle it
        return;
      }

      // If we got here, validation passed
      if (isLastStep) {
        setIsComplete(true);
        return;
      }
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // For non-form steps, just proceed
      if (isLastStep) {
        setIsComplete(true);
        return;
      }
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStep, stepResponses, isLastStep]);

  const handleBack = useCallback(() => {
    if (!isFirstStep && workflow.flow_behavior.allow_back_navigation) {
      // Get the previous step
      const previousStep = workflow.steps[currentStepIndex - 1];
      
      // If previous step is a text step with auto-advance, go back two steps
      if (previousStep?.type === 'text' && previousStep.data?.auto_advance?.enabled) {
        setCurrentStepIndex(prev => Math.max(0, prev - 2));
      } else {
        // Otherwise, go back one step
        setCurrentStepIndex(prev => prev - 1);
      }
    }
  }, [isFirstStep, workflow.flow_behavior.allow_back_navigation, currentStepIndex, workflow.steps]);

  const handleStepResponse = useCallback((stepId: string, response: any) => {
    console.log('Step response received:', { stepId, response }); // Add logging
    setStepResponses(prev => ({
      ...prev,
      [stepId]: response
    }));
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white">
      {workflow.flow_behavior.show_progress_indicator && (
        <div className="fixed top-0 left-0 w-full z-50">
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-blue-600 transition-all duration-700 ease-in-out"
              style={{ 
                width: showProgress ? (isComplete ? '100%' : `${((currentStepIndex + 1) / (workflow.steps.length + 1)) * 100}%`) : '0%'
              }}
            />
          </div>
        </div>
      )}
      
      {isComplete ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Preview Complete!</h2>
            <p className="text-muted-foreground">
              You've reached the end of the workflow preview.
            </p>
            <button
              onClick={() => {
                setIsComplete(false);
                setCurrentStepIndex(0);
                setStepResponses({});
                // Reset progress animation when starting over
                setShowProgress(false);
                setTimeout(() => setShowProgress(true), 100);
              }}
              className="mt-6 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-base font-medium"
            >
              Start Over
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl mx-auto relative">
              <StepRenderer
                step={currentStep}
                onResponse={handleStepResponse}
                response={stepResponses[currentStep.id]}
              />
            </div>
          </div>

          {/* Only show navigation controls if auto-advance is not enabled */}
          {!(currentStep.type === 'text' && currentStep.data?.auto_advance?.enabled) && (
            <NavigationControls
              onNext={handleNext}
              onBack={handleBack}
              canGoBack={!isFirstStep && workflow.flow_behavior.allow_back_navigation}
              isLastStep={isLastStep}
            />
          )}
        </>
      )}
    </div>
  );
} 