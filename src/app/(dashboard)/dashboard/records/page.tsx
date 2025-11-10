
'use client';

import { useMemo, useState } from 'react';
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
import { collection, collectionGroup } from 'firebase/firestore';
import { WithId } from '@/firebase/firestore/use-collection';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ExportDialog } from './export-dialog';
import type { Appointment } from '@/lib/types';

type Patient = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
};

export type PatientWithAppointments = WithId<Patient> & {
  appointments: WithId<Appointment>[];
};

export default function HealthRecordsPage() {
  const firestore = useFirestore();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Fetch all patients
  const patientsCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'patients') : null),
    [firestore]
  );
  const { data: patients, isLoading: isPatientsLoading } =
    useCollection<Patient>(patientsCollectionRef);

  // Fetch all appointments across all patients
  const allAppointmentsQuery = useMemoFirebase(
      () => (firestore ? collectionGroup(firestore, 'appointments') : null),
      [firestore]
  )
  const { data: allAppointments, isLoading: isAppointmentsLoading } = useCollection<Appointment>(allAppointmentsQuery);


  // Combine patients and their appointments
  const patientsWithAppointments: PatientWithAppointments[] = useMemo(() => {
    if (!patients || !allAppointments) return [];
    
    const appointmentsMap = new Map<string, WithId<Appointment>[]>();
    allAppointments.forEach(appt => {
        if (!appointmentsMap.has(appt.patientId)) {
            appointmentsMap.set(appt.patientId, []);
        }
        appointmentsMap.get(appt.patientId)!.push(appt);
    });

    return patients.map(patient => ({
      ...patient,
      appointments: appointmentsMap.get(patient.id) || [],
    }));

  }, [patients, allAppointments]);


  const isLoading = isPatientsLoading || isAppointmentsLoading;
  
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
          <Button
            variant="outline"
            onClick={() => setIsExportDialogOpen(true)}
            disabled={isLoading || !patientsWithAppointments || patientsWithAppointments.length === 0}
          >
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
                  <TableHead>Email</TableHead>
                  <TableHead>Consultations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patientsWithAppointments && patientsWithAppointments.length > 0 ? (
                  patientsWithAppointments.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.firstName} {record.lastName}
                      </TableCell>
                       <TableCell>
                        {record.email}
                      </TableCell>
                      <TableCell>
                        {record.appointments.length}
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
      
      <ExportDialog
        isOpen={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        data={patientsWithAppointments || []}
      />
    </div>
  );
}
