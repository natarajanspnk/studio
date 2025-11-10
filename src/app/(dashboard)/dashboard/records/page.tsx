
'use client';

import { useMemo } from 'react';
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
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { WithId } from '@/firebase/firestore/use-collection';
import { LoadingSpinner } from '@/components/loading-spinner';

type Patient = {
  firstName: string;
  lastName: string;
  email: string;
};

export default function HealthRecordsPage() {
  const firestore = useFirestore();
  const patientsCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'patients') : null),
    [firestore]
  );
  const { data: patients, isLoading } = useCollection<Patient>(patientsCollectionRef);

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
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : (
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
                {patients && patients.length > 0 ? (
                  patients.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.firstName} {record.lastName}
                      </TableCell>
                      <TableCell>
                        {new Date().toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        Follow-up required
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" disabled>
                          <Eye className="mr-2 h-4 w-4" />
                          View Record
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No patient records found.
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
