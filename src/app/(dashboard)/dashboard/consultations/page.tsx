'use client';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, ArrowRight, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { LoadingSpinner } from '@/components/loading-spinner';
import { format } from 'date-fns';

type Appointment = {
  id: string;
  dateTime: string;
  doctorName: string;
  doctorSpecialty: string;
  status: 'scheduled' | 'completed' | 'cancelled';
};

export default function ConsultationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const appointmentsCollectionRef = useMemoFirebase(
    () => (user && firestore ? collection(firestore, 'patients', user.uid, 'appointments') : null),
    [user, firestore]
  );
  
  const appointmentsQuery = useMemoFirebase(
      () => (appointmentsCollectionRef ? query(appointmentsCollectionRef, orderBy('dateTime', 'desc')) : null),
      [appointmentsCollectionRef]
  )

  const { data: appointments, isLoading } = useCollection<Appointment>(appointmentsQuery);

  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Your Consultations
        </h2>
        <p className="mt-2 text-muted-foreground">
          Manage your upcoming and view past video consultations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consultation Schedule</CardTitle>
          <CardDescription>
            A list of your scheduled and completed video calls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="flex justify-center p-8"><LoadingSpinner /></div>}
          {!isLoading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments && appointments.length > 0 ? (
                  appointments.map((consult) => (
                    <TableRow key={consult.id}>
                      <TableCell className="font-medium">
                        {format(new Date(consult.dateTime), "PPP 'at' p")}
                      </TableCell>
                      <TableCell>
                        <div>Dr. {consult.doctorName}</div>
                        <div className="text-sm text-muted-foreground">{consult.doctorSpecialty}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(consult.status)} className={consult.status === 'scheduled' ? 'bg-green-500' : ''}>
                          {consult.status.charAt(0).toUpperCase() + consult.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {consult.status === 'scheduled' ? (
                          <Button asChild>
                            <Link href={`/consultation/${consult.id}`}>
                              <Video className="mr-2 h-4 w-4" />
                              Join Call
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="outline" asChild>
                             <Link href={`/dashboard/records`}>
                               View Record <ArrowRight className="ml-2 h-4 w-4" />
                             </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No consultations scheduled.
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
