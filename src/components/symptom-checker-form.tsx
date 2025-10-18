'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getSymptomAnalysis } from '@/lib/actions';
import { type SymptomCheckerOutput } from '@/ai/flows/ai-symptom-checker';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  symptoms: z
    .string()
    .min(20, 'Please provide a more detailed description of your symptoms.')
    .max(5000, 'The description is too long. Please summarize your symptoms.'),
});

export function SymptomCheckerForm() {
  const [analysis, setAnalysis] = useState<SymptomCheckerOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      symptoms: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setAnalysis(null);

    const result = await getSymptomAnalysis({
      symptomsDescription: values.symptoms,
    });

    setIsLoading(false);

    if (result.error || !result.data) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description:
          result.error || 'An unexpected error occurred. Please try again.',
      });
    } else {
      setAnalysis(result.data);
    }
  }

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="symptoms"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg">Your Symptoms</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., I've had a persistent dry cough, a low-grade fever, and body aches for the last three days..."
                    className="min-h-[150px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Analyzing...' : 'Analyze Symptoms'}
          </Button>
        </form>
      </Form>

      {analysis && (
        <div className="mt-10 space-y-6 animate-in fade-in-50 duration-500">
          <Separator />
          <h3 className="font-headline text-2xl font-bold">Analysis Results</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Potential Health Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {analysis.potentialHealthIssues}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Suggestions for Consultation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{analysis.suggestions}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
