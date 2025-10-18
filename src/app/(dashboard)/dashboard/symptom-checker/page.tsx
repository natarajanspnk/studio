import { SymptomCheckerForm } from '@/components/symptom-checker-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb } from 'lucide-react';

export default function SymptomCheckerPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          AI-Powered Symptom Checker
        </h2>
        <p className="mt-2 text-muted-foreground">
          Describe your symptoms in detail below. Our AI will provide a
          preliminary analysis to help you understand potential issues and
          suggest the right type of specialist to consult.
        </p>
      </div>

      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Disclaimer</AlertTitle>
        <AlertDescription>
          This tool does not provide medical advice. It is intended for
          informational purposes only. Consult with a qualified healthcare
          professional for any medical concerns or before making any decisions
          related to your health.
        </AlertDescription>
      </Alert>

      <SymptomCheckerForm />
    </div>
  );
}
