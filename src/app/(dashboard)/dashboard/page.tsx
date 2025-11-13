
'use client';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, Calendar, Plus, Stethoscope, Video } from 'lucide-react';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

// This is the Patient Dashboard

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();

  return (
    <div className="grid gap-8">
      <div>
        {isUserLoading ? (
          <Skeleton className="h-9 w-64" />
        ) : (
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
          </h2>
        )}
        <p className="text-muted-foreground">
          Here&apos;s a quick overview of your patient dashboard.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              <span>Symptom Checker</span>
            </CardTitle>
            <CardDescription>
              Get preliminary insights on your symptoms.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p>
              Feeling unwell? Describe your symptoms to our AI-powered tool to
              get an idea of potential issues and decide on the right
              specialist to consult.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/symptom-checker">
                Check Symptoms <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              <span>Book an Appointment</span>
            </CardTitle>
            <CardDescription>
              Schedule your next consultation with one of our specialists.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p>
              Browse available doctors and time slots to find a time that works
              for you. Booking is fast, easy, and secure.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/dashboard/appointments">
                Book Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              <span>Your Consultations</span>
            </CardTitle>
            <CardDescription>
              Join your scheduled video calls.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p>
             Check your upcoming appointments and join the video call at the scheduled time.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/consultations">
                View Consultations <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
