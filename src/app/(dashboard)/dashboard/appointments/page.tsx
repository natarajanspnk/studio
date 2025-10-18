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
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const doctors = [
  {
    id: 1,
    name: 'Dr. Emily Carter',
    specialty: 'Cardiologist',
    avatarId: 'doctor-1',
  },
  {
    id: 2,
    name: 'Dr. Ben Adams',
    specialty: 'Dermatologist',
    avatarId: 'doctor-2',
  },
  {
    id: 3,
    name: 'Dr. Chloe Davis',
    specialty: 'Pediatrician',
    avatarId: 'doctor-3',
  },
];

const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

export default function AppointmentsPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ doctor: any, time: string } | null>(null);
  const { toast } = useToast();

  const handleBookAppointment = () => {
    if (selectedSlot && date) {
      toast({
        title: 'Appointment Booked!',
        description: `Your appointment with ${selectedSlot.doctor.name} on ${date.toLocaleDateString()} at ${selectedSlot.time} is confirmed.`,
      });
      setSelectedSlot(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Book an Appointment
        </h2>
        <p className="mt-2 text-muted-foreground">
          Select a date and choose an available time slot with one of our specialists.
        </p>
      </div>

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
              disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
            />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {doctors.map((doctor) => {
            const avatar = placeholderImages.find(
              (img) => img.id === doctor.avatarId
            );
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
                  </div>
                  <div>
                    <CardTitle>{doctor.name}</CardTitle>
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
                          onClick={() => setSelectedSlot({ doctor, time })}
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
       <AlertDialog
        onOpenChange={(open) => !open && setSelectedSlot(null)}
        open={selectedSlot !== null}
       >
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
               <p><span className="font-medium">Doctor:</span> {selectedSlot.doctor.name} ({selectedSlot.doctor.specialty})</p>
               <p><span className="font-medium">Date:</span> {date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
               <p><span className="font-medium">Time:</span> {selectedSlot.time}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBookAppointment}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
