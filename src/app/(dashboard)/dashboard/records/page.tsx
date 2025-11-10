
'use client';

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

const placeholderRecords = [
    {
        id: '1',
        patientName: 'Liam Johnson',
        lastUpdated: '2023-10-25',
        details: 'Annual Checkup',
    },
    {
        id: '2',
        patientName: 'Olivia Smith',
        lastUpdated: '2023-10-22',
        details: 'Follow-up on seasonal allergies',
    },
    {
        id: '3',
        patientName: 'Noah Williams',
        lastUpdated: '2023-09-15',
        details: 'Prescription Refill',
    },
    {
        id: '4',
        patientName: 'Emma Brown',
        lastUpdated: '2023-08-30',
        details: 'Initial Consultation',
    },
];


export default function HealthRecordsPage() {

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          Health Records
        </h2>
        <p className="mt-2 text-muted-foreground">
          View and manage patient health records.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>All Records</CardTitle>
            <CardDescription>
              A list of all patient health records on the platform.
            </CardDescription>
          </div>
          <Button variant="outline" disabled>
            <FileDown className="mr-2 h-4 w-4" />
            Export All
          </Button>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placeholderRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.patientName}
                      </TableCell>
                      <TableCell>{record.lastUpdated}</TableCell>
                      <TableCell>{record.details}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" disabled>
                          <Eye className="mr-2 h-4 w-4" />
                          View Record
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

