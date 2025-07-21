
'use client';

import Papa from 'papaparse';
import type { Event } from './types';
import { format } from 'date-fns';


// The fields must match the Event type exactly for reliable import/export.
const CSV_EXPORT_HEADERS: (keyof Omit<Event, 'id'>)[] = [
  'title',
  'description',
  'date',
  'repeat',
  'repeatAbout',
  'reminderEnabled',
  'reminderValue',
  'reminderUnit',
  'alarm',
  'isBirthday'
];

export function exportEventsToCSV(events: Event[]) {
  const dataToExport = events.map(event => {
    const { id, ...rest } = event;
    const exportableData: { [key: string]: any } = {};
    CSV_EXPORT_HEADERS.forEach(header => {
      exportableData[header] = rest[header as keyof typeof rest] ?? '';
    });
    return exportableData;
  });

  const csv = Papa.unparse(dataToExport, {
    columns: CSV_EXPORT_HEADERS,
    header: true,
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const formattedDate = format(new Date(), 'yyyy-MM-dd');
  link.setAttribute('href', url);
  link.setAttribute('download', `Schedule_Events_${formattedDate}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function importEventsFromCSV(file: File): Promise<Omit<Event, 'id'>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Omit<Event, 'id'>>(file, {
      header: true,
      skipEmptyLines: true,
      transform(value, field) {
        // Papaparse reads everything as strings, so we need to convert to correct types
        const fieldName = field as keyof Omit<Event, 'id'>;
        if (value === '' || value === null || value === undefined) {
          return undefined;
        }
        
        const booleanFields: (keyof Omit<Event, 'id'>)[] = ['reminderEnabled', 'alarm', 'isBirthday'];
        if (booleanFields.includes(fieldName)) {
            return value.toLowerCase() === 'true';
        }

        if (fieldName === 'reminderValue') {
            const num = parseInt(value, 10);
            return isNaN(num) ? undefined : num;
        }
        
        if (fieldName === 'date') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? undefined : date.toISOString();
        }

        return value;
      },
      complete(results) {
        if (results.errors.length) {
          console.error('CSV Parsing Errors:', results.errors);
          reject(new Error(`Error parsing row ${results.errors[0].row}: ${results.errors[0].message}`));
          return;
        }
        
        const importedEvents = results.data.filter(e => e.title && e.date);

        if (importedEvents.length === 0 && results.data.length > 0) {
           reject(new Error("CSV file seems to be invalid or empty. 'title' and 'date' are required."));
           return;
        }

        resolve(importedEvents);
      },
      error(error) {
        reject(error);
      },
    });
  });
}
