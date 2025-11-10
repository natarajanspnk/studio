
export type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  dateTime: string;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  doctorName: string;
  doctorSpecialty: string;
  patientName: string;
};
