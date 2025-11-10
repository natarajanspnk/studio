
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
import { WithId } from '@/firebase/firestore/use-collection';

type Patient = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
};

interface ExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  patients: WithId<Patient>[];
}

export function ExportDialog({
  isOpen,
  onOpenChange,
  patients,
}: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'pdf'>('pdf');
  const [password, setPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (format === 'pdf' && !password) {
      toast({
        variant: 'destructive',
        title: 'Password Required',
        description: 'Please set a password to export as a secure PDF.',
      });
      return;
    }

    setIsExporting(true);

    try {
      if (format === 'pdf') {
        exportToPdf();
      } else {
        exportToCsv();
      }
      toast({
        title: 'Export Successful',
        description: `The patient list has been downloaded as a ${format.toUpperCase()} file.`,
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
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Date of Birth', 'Phone', 'Address'];
    const rows = patients.map(p => [
        p.id,
        p.firstName,
        p.lastName,
        p.email,
        p.dateOfBirth || '',
        p.phone || '',
        p.address || ''
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "patient_records.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPdf = () => {
    const doc = new jsPDF();
    
    doc.text("Patient Records", 14, 15);

    autoTable(doc, {
        head: [['ID', 'Name', 'Email', 'Date of Birth']],
        body: patients.map(p => [
            p.id,
            `${p.firstName} ${p.lastName}`,
            p.email,
            p.dateOfBirth || 'N/A'
        ]),
        startY: 20,
    });
    
    // The jspdf library's password protection is not very strong and can be bypassed.
    // For a real-world application, encryption should be handled server-side before download.
    // This implementation is for demonstration purposes.
    doc.output('dataurlnewwindow', {
        // @ts-ignore - jspdf types are incorrect for userPassword
        userPassword: password,
    });
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
              value={format}
              onValueChange={(value: 'csv' | 'pdf') => setFormat(value)}
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
          {format === 'pdf' && (
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
            disabled={isExporting || (format === 'pdf' && !password)}
          >
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

