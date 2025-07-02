export class SetAvailabilityDto {
  date: string;
  start_time: string;
  end_time: string;
  weekdays: string[]; // Optional
  session: 'morning' | 'evening';
  interval_minutes: number; // Optional: default 30
}
