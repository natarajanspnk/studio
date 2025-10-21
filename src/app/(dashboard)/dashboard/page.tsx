'use client';

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { placeholderImages } from '@/lib/placeholder-images';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const doctorAvatar = placeholderImages.find((img) => img.id === 'doctor-1');

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
          Here&apos;s a quick overview of your health dashboard.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Upcoming Appointment</span>
            </CardTitle>
            <CardDescription>
              You have an upcoming consultation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4">
            <div className="flex items-center space-x-4 rounded-md border p-4">
              <Avatar>
                {doctorAvatar && (
                  <AvatarImage
                    src={doctorAvatar.imageUrl}
                    alt={doctorAvatar.description}
                    data-ai-hint={doctorAvatar.imageHint}
                  />
                )}
                <AvatarFallback>EC</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Dr. Emily Carter
                </p>
                <p className="text-sm text-muted-foreground">Cardiologist</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">
                Tomorrow, May 25, 2024 at 10:30 AM
              </p>
              <p className="text-sm text-muted-foreground">
                Video Consultation
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" asChild>
              <Link href="/consultation/123">
                <Video className="mr-2 h-4 w-4" />
                Join Call
              </Link>
            </Button>
          </CardFooter>
        </Card>

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
      </div>
    </div>
  );
}
