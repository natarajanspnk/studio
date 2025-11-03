'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { placeholderImages } from '@/lib/placeholder-images';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { LoadingSpinner } from '@/components/loading-spinner';
import { WithId } from '@/firebase/firestore/use-collection';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { serverTimestamp } from 'firebase/firestore';

type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  isAvailable: boolean;
};

const timeSlots = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
];

export default function AppointmentsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{
    doctor: WithId<Doctor>;
    time: string;
  } | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const doctorsCollection = useMemoFirebase(
    () => (firestore ? collection(firestore, 'doctors') : null),
    [firestore]
  );
  const { data: doctors, isLoading } = useCollection<Doctor>(doctorsCollection);

  const handleBookAppointment = async () => {
    if (!selectedSlot || !date || !user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Booking Failed',
        description: 'Missing information to book the appointment.',
      });
      return;
    }

    setIsBooking(true);

    const appointmentDateTime = new Date(date);
    const [time, modifier] = selectedSlot.time.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (hours === 12) {
      hours = modifier === 'AM' ? 0 : 12;
    } else if (modifier === 'PM') {
      hours += 12;
    }

    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    const appointmentId = doc(collection(firestore, 'id_generator')).id;

    const appointmentData = {
      id: appointmentId,
      patientId: user.uid,
      doctorId: selectedSlot.doctor.id,
      dateTime: appointmentDateTime.toISOString(),
      notes: `Appointment with Dr. ${selectedSlot.doctor.firstName} ${selectedSlot.doctor.lastName}`,
      status: 'scheduled',
      doctorName: `${selectedSlot.doctor.firstName} ${selectedSlot.doctor.lastName}`,
      doctorSpecialty: selectedSlot.doctor.specialty,
      patientName: user.displayName || 'Unknown Patient'
    };

    try {
      const patientAppointmentRef = doc(firestore, 'patients', user.uid, 'appointments', appointmentId);
      const doctorAppointmentRef = doc(firestore, 'doctors', selectedSlot.doctor.id, 'appointments', appointmentId);
      
      // Create appointment in both places
      await Promise.all([
        setDoc(patientAppointmentRef, appointmentData),
        setDoc(doctorAppointmentRef, appointmentData),
      ]);


      toast({
        title: 'Appointment Booked!',
        description: `Your appointment with Dr. ${selectedSlot.doctor.firstName} ${selectedSlot.doctor.lastName} is confirmed.`,
      });
    } catch (error) {
        console.error("Error booking appointment: ", error);
      toast({
        variant: 'destructive',
        title: 'Booking Failed',
        description: 'Could not save the appointment. Please try again.',
      });
    } finally {
        setIsBooking(false);
        setSelectedSlot(null);
        setOpenDialog(false);
    }
  };

  const handleTriggerClick = (doctor: WithId<Doctor>, time: string) => {
    setSelectedSlot({ doctor, time });
    setOpenDialog(true);
  };


  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Book an Appointment
        </h2>
        <p className="mt-2 text-muted-foreground">
          Select a date and choose an available time slot with one of our
          specialists.
        </p>
      </div>
      <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Select a Date</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </CardContent>
          </Card>

          <div className="space-y-6 lg:col-span-2">
            {isLoading && (
              <div className="flex justify-center p-8">
                <LoadingSpinner />
              </div>
            )}
            {doctors?.map((doctor) => {
              const avatar =
                placeholderImages.find(
                  (img) => img.id === `doctor-${doctor.id.slice(0, 1)}`
                ) || placeholderImages.find((img) => img.id === 'doctor-1');

              return (
                <Card key={doctor.id}>
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
                      {avatar && (
                        <Image
                          src={avatar.imageUrl}
                          alt={avatar.description}
                          fill
                          className="object-cover"
                          data-ai-hint={avatar.imageHint}
                        />
                      )}
                      <div
                        className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card ${
                          doctor.isAvailable ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      ></div>
                    </div>
                    <div>
                      <CardTitle>
                        Dr. {doctor.firstName} {doctor.lastName}
                      </CardTitle>
                      <CardDescription>{doctor.specialty}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="mb-2 font-semibold">Available Slots</h4>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {timeSlots.map((time) => (
                        <AlertDialogTrigger asChild key={time}>
                           <Button
                            variant="outline"
                            disabled={!doctor.isAvailable || isBooking}
                            onClick={() => handleTriggerClick(doctor, time)}
                          >
                            {time}
                          </Button>
                        </AlertDialogTrigger>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to book this appointment?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedSlot && date && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="font-semibold">Appointment Details:</div>
              <p>
                <span className="font-medium">Doctor:</span> Dr.{' '}
                {selectedSlot.doctor.firstName} {selectedSlot.doctor.lastName} (
                {selectedSlot.doctor.specialty})
              </p>
              <p>
                <span className="font-medium">Date:</span>{' '}
                {date.toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p>
                <span className="font-medium">Time:</span> {selectedSlot.time}
              </p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSlot(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBookAppointment}
              disabled={isBooking}
            >
              {isBooking ? 'Booking...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
