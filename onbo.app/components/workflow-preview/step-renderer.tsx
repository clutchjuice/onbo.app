import { TextStep } from '@/components/workflow-preview/steps/text-step';
import { VideoStep } from '@/components/workflow-preview/steps/video-step';
import { FormStep } from '@/components/workflow-preview/steps/form-step';
import { ContractStep } from '@/components/workflow-preview/steps/contract-step';
import { SchedulingStep } from '@/components/workflow-preview/steps/scheduling-step';
import { DocumentStep } from '@/components/workflow-preview/steps/document-step';
import { PaymentStep } from '@/components/workflow-preview/steps/payment-step';

interface StepRendererProps {
  step: {
    id: string;
    type: string;
    data: any;
  };
  onResponse: (stepId: string, response: any) => void;
  response?: any;
}

export function StepRenderer({ step, onResponse, response }: StepRendererProps) {
  if (!step) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
        <h3 className="font-semibold">Invalid Step</h3>
        <p className="mt-1 text-sm">
          The step configuration is missing.
        </p>
      </div>
    );
  }

  const stepComponents: Record<string, React.ComponentType<any>> = {
    text: TextStep,
    video: VideoStep,
    form: FormStep,
    contract_esign: ContractStep,
    scheduling: SchedulingStep,
    document_embed: DocumentStep,
    payment: PaymentStep,
  };

  const StepComponent = stepComponents[step.type];

  if (!StepComponent) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
        <h3 className="font-semibold">Unsupported Step Type</h3>
        <p className="mt-1 text-sm">
          The step type "{step.type}" is not supported in preview mode.
        </p>
      </div>
    );
  }

  // Map the step data to the expected config format
  const config = {
    ...step.data,
    fields: step.data?.fields || [],
    // Map video properties to expected format
    ...(step.type === 'video' && {
      source_type: step.data.embedCode ? 'embed' : 'url', // Force embed if we have an embed code
      url: step.data.videoUrl,
      embed_code: step.data.embedCode,
      header: step.data.header,
      description: step.data.description,
      require_completion: false // Add this if you want to make it configurable later
    })
  };

  return (
    <StepComponent
      config={config}
      onComplete={(response: any) => onResponse(step.id, response)}
      response={response}
    />
  );
} 