'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth, useDoc, useFirestore, useUser } from '@/firebase';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useMemoFirebase } from '@/firebase/provider';
import { doc } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export default function LoginPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Hooks to check for user documents
  const patientDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'patients', user.uid) : null),
    [firestore, user]
  );
  const { data: patientData, isLoading: isPatientLoading } = useDoc(patientDocRef, { enabled: !!user });

  const doctorDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'doctors', user.uid) : null),
    [firestore, user]
  );
  const { data: doctorData, isLoading: isDoctorLoading } = useDoc(doctorDocRef, { enabled: !!user });


  useEffect(() => {
    // Don't do anything until we have a user and their role data has been checked.
    if (isUserLoading || !user || isPatientLoading || isDoctorLoading) {
      return;
    }
    
    setIsRedirecting(true);

    if (patientData) {
      router.push('/dashboard');
    } else if (doctorData) {
      router.push('/dashboard/staff');
    } else {
      // Fallback in case the user has an auth record but no patient/doctor document.
      // This could happen if the signup process was interrupted.
      console.warn("User has no role document. Redirecting to generic dashboard.");
      router.push('/dashboard');
    }

  }, [user, isUserLoading, patientData, doctorData, isPatientLoading, isDoctorLoading, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    initiateEmailSignIn(auth, values.email, values.password, (error) => {
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'Invalid credentials. Please check your email and password.',
        });
    });
  }

  // Show loading spinner if Firebase auth is loading, or if we have a user but are still determining their role.
  if (isUserLoading || isRedirecting || (user && (isPatientLoading || isDoctorLoading))) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // If we're done loading and there's a user, they will be redirected by the useEffect.
  // This prevents the login form from flashing briefly. If no user, show the form.
  if (user) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-3xl font-bold text-card-foreground">
          Welcome Back
        </CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="m@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
