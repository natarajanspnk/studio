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
import { useAuth, useFirestore, useUser } from '@/firebase';
import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { LoadingSpinner } from '@/components/loading-spinner';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['patient', 'doctor'], {
    required_error: 'You need to select a role.',
  }),
});

export default function SignupPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'patient',
    },
  });

  useEffect(() => {
    const role = form.watch('role');
    if (!isUserLoading && user) {
        if(role === 'doctor') {
            router.push('/dashboard/staff');
        } else {
            router.push('/dashboard');
        }
    }
  }, [user, isUserLoading, router, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    initiateEmailSignUp(auth, values.email, values.password, (error: any) => {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: 'destructive',
          title: 'Sign-up Failed',
          description:
            'This email address is already in use. Please try another one.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Sign-up Failed',
          description: error.message || 'An unexpected error occurred.',
        });
      }
    });
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser && form.formState.isSubmitSuccessful && firestore) {
        try {
          // Update Auth Profile
          await updateProfile(currentUser, {
            displayName: form.getValues('fullName'),
          });

          const role = form.getValues('role');
          const [firstName, ...lastNameParts] =
            form.getValues('fullName').split(' ');

          if (role === 'patient') {
            const patientRef = doc(firestore, 'patients', currentUser.uid);
            const patientData = {
              id: currentUser.uid,
              role: 'patient',
              firstName,
              lastName: lastNameParts.join(' '),
              email: currentUser.email,
              dateOfBirth: '',
              gender: '',
              phone: '',
              address: '',
            };
            setDocumentNonBlocking(patientRef, patientData, { merge: true });
          } else if (role === 'doctor') {
            const doctorRef = doc(firestore, 'doctors', currentUser.uid);
            const doctorData = {
              id: currentUser.uid,
              role: 'doctor',
              firstName,
              lastName: lastNameParts.join(' '),
              email: currentUser.email,
              specialty: 'General Medicine', // Default value
              phone: '',
              address: '',
              isAvailable: false,
            };
            setDocumentNonBlocking(doctorRef, doctorData, { merge: true });
          }
        } catch (error) {
          console.error('Failed to update profile or create user document', error);
          toast({
            variant: 'destructive',
            title: 'Setup Failed',
            description: 'Could not create your user profile. Please try again.',
          });
        }
      }
    });
    return () => unsubscribe();
  }, [auth, form, firestore, toast]);

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
        <CardDescription>
          Enter your information to create a new account
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>I am a...</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="patient" />
                        </FormControl>
                        <FormLabel className="font-normal">Patient</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="doctor" />
                        </FormControl>
                        <FormLabel className="font-normal">Doctor</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              {form.formState.isSubmitting
                ? 'Creating Account...'
                : 'Create Account'}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
