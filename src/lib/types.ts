
export type ReminderUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'about';
  repeatAbout?: string;
  reminderEnabled: boolean;
  reminderValue?: number;
  reminderUnit?: ReminderUnit;
  alarm: boolean;
  isBirthday?: boolean;
  labelIds?: string[];
  isCompleted?: boolean;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}
