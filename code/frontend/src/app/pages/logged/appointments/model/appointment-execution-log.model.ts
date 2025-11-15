export interface AppointmentExecutionLog {
  id: number;
  appointmentId: number;
  appointmentName: string;
  scheduledTime: string;
  executionTime: string;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
  errorMessage?: string;
}

