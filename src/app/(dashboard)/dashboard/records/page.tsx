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
import { FileDown, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const records = [
  {
    id: 1,
    date: '2024-04-15',
    doctor: 'Dr. Emily Carter',
    specialty: 'Cardiologist',
    diagnosis: 'Hypertension',
    prescription: 'Lisinopril 10mg',
  },
  {
    id: 2,
    date: '2024-02-20',
    doctor: 'Dr. Ben Adams',
    specialty: 'Dermatologist',
    diagnosis: 'Acne Vulgaris',
    prescription: 'Topical Retinoid',
  },
  {
    id: 3,
    date: '2023-11-10',
    doctor: 'Dr. Emily Carter',
    specialty: 'Cardiologist',
    diagnosis: 'Routine Check-up',
    prescription: 'N/A',
  },
  {
    id: 4,
    date: '2023-09-01',
    doctor: 'Dr. Chloe Davis',
    specialty: 'Pediatrician',
    diagnosis: 'Seasonal Allergies',
    prescription: 'Antihistamine',
  },
];

export default function HealthRecordsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Your Health Records
        </h2>
        <p className="mt-2 text-muted-foreground">
          A comprehensive history of your consultations and medical records.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Consultation History</CardTitle>
            <CardDescription>
              Click on a record for more details.
            </CardDescription>
          </div>
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export All
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Diagnosis</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.date}</TableCell>
                  <TableCell>
                    <div>{record.doctor}</div>
                    <div className="text-sm text-muted-foreground">{record.specialty}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{record.diagnosis}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View Details</span>
                    </Button>
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
