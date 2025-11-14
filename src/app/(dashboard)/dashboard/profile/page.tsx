'use client';
export const dynamic = 'force-dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth, useDoc, useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { updateProfile, verifyBeforeUpdateEmail } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useEffect, useState } from 'react';
import { useMemoFirebase } from '@/firebase/provider';

const profileFormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email(),
  phone: z.string().optional(),
  // Patient specific
  dateOfBirth: z.string().optional(),
  // Doctor specific
  specialty: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<'patient' | 'doctor' | null>(null);

  const patientDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'patients', user.uid) : null),
    [firestore, user]
  );
  const { data: patientData, isLoading: isPatientDataLoading } = useDoc(patientDocRef, { enabled: userRole === 'patient' });

  const doctorDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'doctors', user.uid) : null),
    [firestore, user]
  );
  const { data: doctorData, isLoading: isDoctorDataLoading } = useDoc(doctorDocRef, { enabled: userRole === 'doctor' });

   const {data: initialPatientData, isLoading: isInitialPatientLoading} = useDoc(patientDocRef);
   const {data: initialDoctorData, isLoading: isInitialDoctorLoading} = useDoc(doctorDocRef);


  useEffect(() => {
    if (initialPatientData) {
      setUserRole('patient');
    } else if (initialDoctorData) {
      setUserRole('doctor');
    }
  }, [initialPatientData, initialDoctorData]);


  const userData = userRole === 'patient' ? patientData : doctorData;
  const isDataLoading = isPatientDataLoading || isDoctorDataLoading || (isInitialDoctorLoading && isInitialPatientLoading);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      specialty: '',
    },
  });

  useEffect(() => {
    // Reset form with default values (empty strings) to ensure inputs are controlled
    // even while user data is loading or is not present.
    form.reset({
      fullName: user?.displayName || '',
      email: user?.email || '',
      phone: (userData as any)?.phone || '',
      dateOfBirth: (userData as any)?.dateOfBirth || '',
      specialty: (userData as any)?.specialty || '',
    });
  }, [user, userData, form]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user || !firestore || !auth.currentUser || !userRole) return;

    try {
      // Update Firebase Auth display name
      if (data.fullName !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName: data.fullName });
      }

      // Update Firebase Auth email
      if (data.email !== user.email) {
        await verifyBeforeUpdateEmail(auth.currentUser, data.email);
        toast({
          title: 'Verification Email Sent',
          description: `A verification link has been sent to ${data.email}. Please check your inbox to confirm the change.`,
        });
      }

      // Update Firestore document
      const [firstName, ...lastNameParts] = data.fullName.split(' ');
      const commonData = {
        firstName,
        lastName: lastNameParts.join(' '),
        email: data.email,
        phone: data.phone,
      };

      if (userRole === 'patient') {
        const patientDocData = {
          ...commonData,
          dateOfBirth: data.dateOfBirth,
        };
        setDocumentNonBlocking(patientDocRef!, patientDocData, { merge: true });
      } else if (userRole === 'doctor') {
        const doctorDocData = {
          ...commonData,
          specialty: data.specialty,
        };
        setDocumentNonBlocking(doctorDocRef!, doctorDocData, { merge: true });
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description:
          error.message ||
          'An unexpected error occurred. You may need to sign out and sign back in to change your email.',
      });
    }
  }

  if (isUserLoading || isDataLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!userRole && !isDataLoading) {
      return (
        <div className="flex h-full items-center justify-center">
            <Card>
                <CardHeader>
                    <CardTitle>Profile Not Found</CardTitle>
                    <CardDescription>We couldn&apos;t find a profile for your user.</CardDescription>
                </CardHeader>
            </Card>
        </div>
      )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Your Profile
        </h2>
        <p className="mt-2 text-muted-foreground">
          View and manage your personal information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
          <CardDescription>
            Update your information below. To change your email, you will be
            sent a verification link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="(123) 456-7890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {userRole === 'patient' && (
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                 {userRole === 'doctor' && (
                  <FormField
                    control={form.control}
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialty</FormLabel>
                        <FormControl>
                          <Input placeholder="Cardiology" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
