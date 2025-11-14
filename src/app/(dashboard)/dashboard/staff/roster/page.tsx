
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUser } from '@/firebase';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
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
import { collection, doc } from 'firebase/firestore';
import { LoadingSpinner } from '@/components/loading-spinner';
import { WithId } from '@/firebase/firestore/use-collection';

export type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  email: string;
  phone: string;
  address: string;
  isAvailable: boolean;
};

export default function RosterPage() {
  const { user } = useUser();

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

  const handleFormSubmit = (values: DoctorFormValues) => {
    if (!firestore) return;

    // A user can only submit a form for themselves
    if (selectedDoctor && user?.uid !== selectedDoctor.id) {
        toast({
            variant: 'destructive',
            title: 'Permission Denied',
            description: 'You can only edit your own profile.',
        });
        return;
    }

    const doctorId =
      selectedDoctor?.id || doc(collection(firestore, 'doctors')).id;
    const doctorRef = doc(firestore, 'doctors', doctorId);

    const doctorData: Doctor = {
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
    
    if (user?.uid !== selectedDoctor.id) {
      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You can only delete your own profile.',
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
                              disabled={user?.uid !== doctor.id}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => openDeleteDialog(doctor)}
                              disabled={user?.uid !== doctor.id}
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
    </Dialog>
  );
}
