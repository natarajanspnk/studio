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
import { MoreHorizontal, PlusCircle, Users, Video } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { DoctorForm, type DoctorFormValues } from './doctor-form';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import {
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { LoadingSpinner } from '@/components/loading-spinner';
import { WithId } from '@/firebase/firestore/use-collection';
import { format } from 'date-fns';
import Link from 'next/link';

export type Doctor = {
  firstName: string;
  lastName: string;
  specialty: string;
  email: string;
  phone: string;
  address: string;
  isAvailable: boolean;
};

type Appointment = {
  id: string;
  dateTime: string;
  patientName: string;
  status: 'scheduled' | 'completed' | 'cancelled';
};


export default function StaffPage() {
  const { user, isUserLoading } = useUser();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<WithId<Doctor> | null>(
    null
  );
  const { toast } = useToast();

  const firestore = useFirestore();
  const doctorsCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'doctors') : null),
    [firestore]
  );
  const {
    data: doctors,
    isLoading: isDoctorsLoading,
    error: doctorsError,
  } = useCollection<Doctor>(doctorsCollectionRef);

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

  const handleFormSubmit = (values: DoctorFormValues) => {
    if (!firestore) return;

    const doctorId =
      selectedDoctor?.id || doc(collection(firestore, 'doctors')).id;
    const doctorRef = doc(firestore, 'doctors', doctorId);

    const doctorData: Doctor & { id: string } = {
      ...values,
      id: doctorId,
    };

    setDocumentNonBlocking(doctorRef, doctorData, { merge: true });

    toast({
      title: selectedDoctor ? 'Doctor Updated' : 'Doctor Added',
      description: `Dr. ${values.firstName} ${values.lastName} has been successfully saved.`,
    });

    setDialogOpen(false);
    setSelectedDoctor(null);
  };

  const openEditDialog = (doctor: WithId<Doctor>) => {
    setSelectedDoctor(doctor);
    setDialogOpen(true);
  };

  const openDeleteDialog = (doctor: WithId<Doctor>) => {
    setSelectedDoctor(doctor);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteDoctor = () => {
    if (!firestore || !selectedDoctor) return;

    // Prevent a doctor from deleting their own account from this UI
    if (user?.uid === selectedDoctor.id) {
        toast({
            variant: 'destructive',
            title: 'Action Not Allowed',
            description: 'You cannot delete your own account from the doctor roster.',
        });
        setDeleteConfirmOpen(false);
        return;
    }

    const doctorRef = doc(firestore, 'doctors', selectedDoctor.id);
    deleteDocumentNonBlocking(doctorRef);

    toast({
      title: 'Doctor Deleted',
      description: `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName} has been removed.`,
    });

    setDeleteConfirmOpen(false);
    setSelectedDoctor(null);
  };

  const openAddDialog = () => {
    setSelectedDoctor(null);
    setDialogOpen(true);
  };

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
                {appointments && appointments.filter(a => new Date(a.dateTime) >= new Date()).length > 0 ? (
                  appointments.filter(a => new Date(a.dateTime) >= new Date()).map((appt) => (
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


      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedDoctor(null);
        }}
      >
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Doctor Roster</CardTitle>
              <CardDescription>
                Manage the list of all doctors on the platform.
              </CardDescription>
            </div>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Doctor
              </Button>
            </DialogTrigger>
          </CardHeader>
          <CardContent>
            {isDoctorsLoading && (
              <div className="flex justify-center p-8">
                <LoadingSpinner />
              </div>
            )}
            {doctorsError && (
              <p className="text-center text-destructive">
                Error loading doctors. Please try again.
              </p>
            )}
            {!isDoctorsLoading && !doctorsError && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Specialty</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors &&
                    doctors.map((doctor) => (
                      <TableRow key={doctor.id}>
                        <TableCell className="font-medium">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </TableCell>
                        <TableCell>{doctor.specialty}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              doctor.isAvailable ? 'default' : 'secondary'
                            }
                            className={doctor.isAvailable ? 'bg-green-500' : ''}
                          >
                            {doctor.isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>{doctor.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {doctor.phone}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => openEditDialog(doctor)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => openDeleteDialog(doctor)}
                                disabled={user?.uid === doctor.id}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  {(!doctors || doctors.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No doctors found. Add one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDoctor ? 'Edit Doctor' : 'Add New Doctor'}
            </DialogTitle>
          </DialogHeader>
          <DoctorForm
            onSubmit={handleFormSubmit}
            defaultValues={selectedDoctor}
          />
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete Dr.{' '}
              {selectedDoctor?.firstName} {selectedDoctor?.lastName} and remove
              their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDoctor(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDoctor}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
