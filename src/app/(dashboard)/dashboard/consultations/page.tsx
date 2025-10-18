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
import { Video, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const consultations = [
  {
    id: '123',
    date: 'Tomorrow, at 10:30 AM',
    doctor: 'Dr. Emily Carter',
    specialty: 'Cardiologist',
    status: 'Upcoming',
  },
  {
    id: '456',
    date: '2024-04-15',
    doctor: 'Dr. Emily Carter',
    specialty: 'Cardiologist',
    status: 'Completed',
  },
  {
    id: '789',
    date: '2024-02-20',
    doctor: 'Dr. Ben Adams',
    specialty: 'Dermatologist',
    status: 'Completed',
  },
  {
    id: '101',
    date: 'Next week, at 02:00 PM',
    doctor: 'Dr. Chloe Davis',
    specialty: 'Pediatrician',
    status: 'Upcoming',
  },
];

export default function ConsultationsPage() {
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
              {consultations.map((consult) => (
                <TableRow key={consult.id}>
                  <TableCell className="font-medium">{consult.date}</TableCell>
                  <TableCell>
                    <div>{consult.doctor}</div>
                    <div className="text-sm text-muted-foreground">{consult.specialty}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={consult.status === 'Upcoming' ? 'default' : 'secondary'}>
                      {consult.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {consult.status === 'Upcoming' ? (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
