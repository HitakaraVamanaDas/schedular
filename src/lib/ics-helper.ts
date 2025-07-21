
'use client';

import * as ics from 'ics';
import ICAL from 'ical.js';
import { parseISO, add, sub, format } from 'date-fns';
import type { Event } from './types';
import { RRule } from 'rrule';

function downloadFile(filename: string, data: string, type: string) {
    const blob = new Blob([data], { type });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function mapRepeatToRRule(event: Event): string | undefined {
  if (event.repeat === 'none') return undefined;

  const dtstart = parseISO(event.date);
  let freq: RRule.Frequency;

  switch (event.repeat) {
    case 'daily':
      freq = RRule.DAILY;
      break;
    case 'weekly':
      freq = RRule.WEEKLY;
      break;
    case 'monthly':
      freq = RRule.MONTHLY;
      break;
    case 'yearly':
      freq = RRule.YEARLY;
      break;
    default:
      return undefined; // 'about' is not supported by RRule in a simple way
  }
  
  const rule = new RRule({
    freq,
    dtstart,
  });

  return rule.toString();
}

export function exportEventsToICS(events: Event[]) {
    const icsEvents: ics.EventAttributes[] = events.map(event => {
        const start = parseISO(event.date);
        const icsEvent: ics.EventAttributes = {
            start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()],
            title: event.title,
            description: event.description,
            duration: { hours: 1 }, // Default duration
            calName: 'Schedule Events',
            uid: event.id,
        };

        const rrule = mapRepeatToRRule(event);
        if (rrule) {
          icsEvent.recurrenceRule = rrule.replace('RRULE:', '');
        }

        if (event.reminderEnabled && event.reminderValue && event.reminderUnit) {
          const alarmDate = sub(start, { [event.reminderUnit]: event.reminderValue });
          icsEvent.alarms = [{
            action: 'display',
            description: 'Reminder',
            trigger: {
              year: alarmDate.getFullYear(),
              month: alarmDate.getMonth() + 1,
              day: alarmDate.getDate(),
              hour: alarmDate.getHours(),
              minute: alarmDate.getMinutes(),
            }
          }]
        } else if (event.alarm) {
          icsEvent.alarms = [{
            action: 'display',
            description: 'Reminder',
            trigger: {
                // Trigger at the time of the event
                year: start.getFullYear(),
                month: start.getMonth() + 1,
                day: start.getDate(),
                hour: start.getHours(),
                minute: start.getMinutes(),
            }
          }]
        }

        return icsEvent;
    });

    const { error, value } = ics.createEvents(icsEvents);

    if (error) {
        console.error('Failed to create ICS file:', error);
        throw new Error('Could not generate ICS file.');
    }

    if (value) {
        const formattedDate = format(new Date(), 'yyyy-MM-dd');
        downloadFile(`Schedule_Events_${formattedDate}.ics`, value, 'text/calendar;charset=utf-8;');
    }
}

function mapRRuleToRepeat(rruleString?: string): Event['repeat'] {
  if (!rruleString) return 'none';
  if (rruleString.includes('FREQ=DAILY')) return 'daily';
  if (rruleString.includes('FREQ=WEEKLY')) return 'weekly';
  if (rruleString.includes('FREQ=MONTHLY')) return 'monthly';
  if (rruleString.includes('FREQ=YEARLY')) return 'yearly';
  return 'none';
}


export function importEventsFromICS(file: File): Promise<Omit<Event, 'id'>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content !== 'string') {
        return reject(new Error('Failed to read file content.'));
      }
      try {
        const jcalData = ICAL.parse(content);
        const vcalendar = new ICAL.Component(jcalData);
        const vevents = vcalendar.getAllSubcomponents('vevent');
        
        const importedEvents: Omit<Event, 'id'>[] = vevents.map((veventComp) => {
          const vevent = new ICAL.Event(veventComp);
          
          const dtstart = vevent.startDate.toJSDate();
          
          const newEvent: Omit<Event, 'id'> = {
            title: vevent.summary || 'Untitled Event',
            description: vevent.description || '',
            date: dtstart.toISOString(),
            repeat: mapRRuleToRepeat(vevent.component.getFirstPropertyValue('rrule')?.toICALString()),
            reminderEnabled: false,
            alarm: false,
            isBirthday: vevent.summary?.toLowerCase().includes('birthday'),
            labelIds: [],
          };

          const valarm = vevent.component.getFirstSubcomponent('valarm');
          if (valarm) {
              const trigger = new ICAL.Trigger(valarm.getFirstPropertyValue('trigger'));
              const triggerTime = trigger.getDtstart().toJSDate();

              if (triggerTime.getTime() === dtstart.getTime()) {
                  newEvent.alarm = true;
              } else {
                  const diff = dtstart.getTime() - triggerTime.getTime();
                  const minutes = Math.round(diff / (1000 * 60));
                  // This is a simplification; it doesn't map perfectly back to days/weeks/months
                  newEvent.reminderEnabled = true;
                  newEvent.reminderValue = minutes;
                  newEvent.reminderUnit = 'minutes';
              }
          }

          return newEvent;
        });
        
        resolve(importedEvents);
      } catch (err) {
        console.error('ICS Parsing Error:', err);
        reject(new Error('Failed to parse ICS file. It might be invalid or corrupted.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsText(file);
  });
}
