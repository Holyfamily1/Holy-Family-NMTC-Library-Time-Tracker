export interface ActiveSession {
  id: string;
  studentName: string;
  level: number;
  timeIn: Date;
}

export interface Duration {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface CompletedSession {
  id: string;
  studentName: string;
  level: number;
  timeIn: Date;
  timeOut: Date;
  duration: Duration;
  notes?: string;
}