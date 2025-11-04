
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Video } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { LoadingSpinner } from '@/components/loading-spinner';
import { format } from 'date-fns';
import Link from 'next/link';

type Appointment = {
  id: string;
  dateTime: string;
  patientName: string;
  status: 'scheduled' | 'completed' | 'cancelled';
};


export default function StaffPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const appointmentsCollectionRef = useMemoFirebase(
    () =>
      user && firestore
        ? collection(firestore, 'doctors', user.uid, 'appointments')
        : null,
    [user, firestore]
  );
  const appointmentsQuery = useMemoFirebase(
    () =>
      appointmentsCollectionRef
        ? query(appointmentsCollectionRef, orderBy('dateTime', 'asc'))
        : null,
    [appointmentsCollectionRef]
  );
  const { data: appointments, isLoading: isAppointmentsLoading } =
    useCollection<Appointment>(appointmentsQuery);
    
  const upcomingAppointments = appointments?.filter(a => a.status === 'scheduled') || [];

  return (
    <div className="grid gap-8">
      <div>
        {isUserLoading ? (
          <Skeleton className="h-9 w-64" />
        ) : (
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Doctor Dashboard
          </h2>
        )}
        <p className="text-muted-foreground">
          Here&apos;s a quick overview of your professional dashboard.
        </p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Upcoming Consultations</CardTitle>
          <CardDescription>Your scheduled appointments for today and the future.</CardDescription>
        </CardHeader>
        <CardContent>
          {isAppointmentsLoading && <div className="flex justify-center p-8"><LoadingSpinner /></div>}
          {!isAppointmentsLoading && (
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appt) => (
                    <TableRow key={appt.id}>
                      <TableCell className="font-medium">{appt.patientName}</TableCell>
                      <TableCell>{format(new Date(appt.dateTime), "PPP 'at' p")}</TableCell>
                       <TableCell>
                        <Badge
                          variant={appt.status === 'scheduled' ? 'default' : 'secondary'}
                          className={appt.status === 'scheduled' ? 'bg-green-500' : ''}
                        >
                          {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                         <Button asChild size="sm">
                            <Link href={`/consultation/${appt.id}`}>
                              <Video className="mr-2 h-4 w-4" />
                              Join Call
                            </Link>
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                   <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No upcoming appointments.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
