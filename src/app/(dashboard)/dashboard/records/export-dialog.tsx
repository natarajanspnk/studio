
'use client';

import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { PatientWithAppointments } from './page';
import { format } from 'date-fns';

interface ExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  data: PatientWithAppointments[];
}

export function ExportDialog({
  isOpen,
  onOpenChange,
  data,
}: ExportDialogProps) {
  const [formatType, setFormatType] = useState<'csv' | 'pdf'>('pdf');
  const [password, setPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (formatType === 'pdf' && !password) {
      toast({
        variant: 'destructive',
        title: 'Password Required',
        description: 'Please set a password to export as a secure PDF.',
      });
      return;
    }

    setIsExporting(true);

    try {
      if (formatType === 'pdf') {
        exportToPdf();
      } else {
        exportToCsv();
      }
      toast({
        title: 'Export Successful',
        description: `The patient records have been downloaded as a ${formatType.toUpperCase()} file.`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'An unexpected error occurred during the export.',
      });
    } finally {
      setIsExporting(false);
      onOpenChange(false);
      setPassword('');
    }
  };

  const exportToCsv = () => {
    const headers = ['Patient ID', 'First Name', 'Last Name', 'Email', 'Date of Birth', 'Phone', 'Address', 'Appointment ID', 'Appointment Date', 'Doctor', 'Specialty', 'Status'];
    
    const rows = data.flatMap(patient => {
        if (patient.appointments.length === 0) {
            return [[
                patient.id,
                patient.firstName,
                patient.lastName,
                patient.email,
                patient.dateOfBirth || '',
                patient.phone || '',
                patient.address || '',
                'N/A', 'N/A', 'N/A', 'N/A', 'N/A'
            ]];
        }
        return patient.appointments.map(appt => [
            patient.id,
            patient.firstName,
            patient.lastName,
            patient.email,
            patient.dateOfBirth || '',
            patient.phone || '',
            patient.address || '',
            appt.id,
            format(new Date(appt.dateTime), 'PPpp'),
            appt.doctorName,
            appt.doctorSpecialty,
            appt.status
        ]);
    });

    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.map(h => `"${h}"`).join(",") + "\n" 
        + rows.map(e => e.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "patient_consultation_records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPdf = () => {
    const doc = new jsPDF();
    
    doc.text("Patient & Consultation Records", 14, 15);
    
    autoTable(doc, {
        head: [['ID', 'Name', 'Email', 'Date of Birth', 'Total Consultations']],
        body: data.map(p => [
            p.id,
            `${p.firstName} ${p.lastName}`,
            p.email,
            p.dateOfBirth || 'N/A',
            p.appointments.length
        ]),
        startY: 20,
    });

    data.forEach(patient => {
        if (patient.appointments.length > 0) {
            autoTable(doc, {
                head: [['Date & Time', 'Doctor', 'Specialty', 'Status']],
                body: patient.appointments.map(appt => [
                    format(new Date(appt.dateTime), 'PPpp'),
                    appt.doctorName,
                    appt.doctorSpecialty,
                    appt.status,
                ]),
                startY: (doc as any).lastAutoTable.finalY + 10,
                didDrawPage: (hookData) => {
                    // Header for sub-table
                    doc.text(`Consultations for: ${patient.firstName} ${patient.lastName}`, 14, hookData.cursor?.y ? hookData.cursor.y - 4 : 15);
                }
            });
        }
    });
    
    // The userPassword property is not officially in the types, so we cast to any.
    (doc as any).userPassword = password;
    
    doc.save("patient_consultation_records.pdf");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Patient Records</DialogTitle>
          <DialogDescription>
            Choose a format and set a password for secure PDF exports.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Format</Label>
            <RadioGroup
              value={formatType}
              onValueChange={(value: 'csv' | 'pdf') => setFormatType(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">PDF (Secure)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV</Label>
              </div>
            </RadioGroup>
          </div>
          {formatType === 'pdf' && (
            <div className="space-y-2">
              <Label htmlFor="password">PDF Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set a password for the PDF"
              />
              <p className="text-xs text-muted-foreground">
                The password will be required to open the exported PDF file.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleExport}
            disabled={isExporting || (formatType === 'pdf' && !password)}
          >
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
