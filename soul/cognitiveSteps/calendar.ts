import { createCognitiveStep, WorkingMemory, ChatMessageRoleEnum, indentNicely, z, useSoulMemory, useActions} from "@opensouls/engine";
import core from "../mentalProcesses/core.js";

export interface CalendarEvent {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export class Calendar {
  private events: CalendarEvent[] = [];

  addEvent(event: CalendarEvent): string {
    this.events.push(event);
    return 'Event added successfully!';
  }

  getEventsByDate(date: string): CalendarEvent[] {
    return this.events.filter(event => event.startDate === date);
  }

  displayEvents(events: CalendarEvent[]): string {
    if (events.length === 0) {
      return 'No events found for the specified date.';
    } else {
      let eventDetails = 'Events:\n';
      events.forEach(event => {
        eventDetails += `Title: ${event.title}\n`;
        eventDetails += `Description: ${event.description}\n`;
        eventDetails += `Start: ${event.startDate} ${event.startTime}\n`;
        eventDetails += `End: ${event.endDate} ${event.endTime}\n`;
        eventDetails += '---\n';
      });
      return eventDetails;
    }
  }
}

function scheduleReengagement(description: string, startDate: string, startTime: string, userTimezone: 'PT' | 'CT' | 'ET' | 'UTC') {
  const { scheduleEvent } = useActions();

  const reminderTime = getReminderTime(startDate, startTime, userTimezone);

  scheduleEvent({
    when: reminderTime,
    perception: { action: "remind", content: description },
    process: core,
  });

  const timeZoneString = getTimeZoneString(userTimezone);

  return reminderTime.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: timeZoneString
  });
}

function getReminderTime(startDate: string, startTime: string, userTimezone: 'PT' | 'CT' | 'ET' | 'UTC'): Date {
  const [year, month, day] = startDate.split('-').map(Number);
  const [hours, minutes, seconds] = startTime.split(':').map(Number);

  // Create a Date object in UTC
  const eventDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));

  let offsetHours: number;
  switch (userTimezone) {
    case 'PT':
      offsetHours = -8;
      break;
    case 'CT':
      offsetHours = -6;
      break;
    case 'ET':
      offsetHours = -5;
      break;
    case 'UTC':
    default:
      offsetHours = 0;
      break;
  }

  // Adjust the event date to the user's timezone by subtracting the offset
  const eventDateUTC = new Date(eventDate.getTime() - offsetHours * 60 * 60 * 1000);

  // Subtract 30 minutes from the UTC time so we get reminded 30 minutes prior to the event
  eventDateUTC.setMinutes(eventDateUTC.getMinutes() - 90);

  return eventDateUTC;
}

function getTimeZoneString(userTimezone: 'PT' | 'CT' | 'ET' | 'UTC'): string {
  switch (userTimezone) {
    case 'PT':
      return 'America/Los_Angeles';
    case 'CT':
      return 'America/Chicago';
    case 'ET':
      return 'America/New_York';
    case 'UTC':
    default:
      return 'UTC';
  }
}

const addCalendarTask = createCognitiveStep((instructions: string) => {
  const params = z.object({
    title: z.string().describe('The title of the calendar event.'),
    description: z.string().describe('The description of the calendar event.'),
    startDate: z.string().describe('The start date of the event. (YYYY-MM-DD FORMAT)').date(),
    startTime: z.string().describe('The start time of the event. (HH:MM:SS 24 HOUR FORMAT)').time(),
    endDate: z.string().describe('The end date of the event. (YYYY-MM-DD FORMAT)').date(),
    endTime: z.string().describe('The end time of the event. (HH:MM:SS 24 HOUR FORMAT)').time()
  });

  return {
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        name: name,
        content: indentNicely`
          ${name} is adding a new calendar event.

          ${instructions}

          Please provide the following information:
          1. The title of the calendar event.
          2. The description of the calendar event.
          3. The start date of the event.
          4. The start time of the event.
          5. The end date of the event.
          6. The end time of the event.

          Reply with the title, description, start date, start time, end date, and end time for the new calendar event.
        `
      };
    },
    schema: params,
    postProcess: async (memory: WorkingMemory, response: z.output<typeof params>) => {
      const { log  } = useActions()
      const userTimezone = useSoulMemory<"PT" | "CT" | "ET" | "UTC">("userTimezone", "PT");
      const calendarEvents = useSoulMemory<CalendarEvent[]>("calendarEvents", []);
      const calendar = new Calendar();
      calendarEvents.current.forEach(event => calendar.addEvent(event));
      const { title, description, startDate, startTime, endDate, endTime } = response;
      const newEvent: CalendarEvent = {
        title,
        description,
        startDate,
        startTime,
        endDate,
        endTime
      };

      // Add the new event to the calendar and update the memory
      calendar.addEvent(newEvent);
      calendarEvents.current.push(newEvent); // Update the calendar database

      const successMessage = `Added a new calendar event: "${title}" - "${description}" from ${startDate} ${startTime} to ${endDate} ${endTime}.`;
      const newMemory = {
        role: ChatMessageRoleEnum.Assistant,
        content: `GHOST ${successMessage}`
      };

      log(successMessage)

      // Convert 24 hour time to 12 hour time for natural language correction
      const convertTo12HourFormat = (time24: string): string => {
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
      };

      const startTime12Hour = convertTo12HourFormat(startTime);

      // Schedule re-engagement 30 minutes before the event
      const reminderDescription = `Reminder: ${title} - ${description} starts soon at ${startTime12Hour} !`;
      const time = scheduleReengagement(reminderDescription, startDate, startTime, userTimezone.current);
      log(`Scheduled re-engagement for event: "${title}" at ${time}`);
      
      return [newMemory, successMessage];
    }
  }
});

const viewCalendar = createCognitiveStep((instructions: string) => {
  const params = z.object({
    startDate: z.string().describe('The start date of the range to view. (YYYY-MM-DD FORMAT)').date(),
    endDate: z.string().describe('The end date of the range to view. (YYYY-MM-DD FORMAT)').date()
  });

  return {
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        name: name,
        content: indentNicely`
          ${name} is viewing calendar events.

          ${instructions}

          Please provide the following information:
          1. The start date of the range.
          2. The end date of the range.

          Reply with the start date and end date for the range of calendar events you want to view.
        `
      };
    },
    schema: params,
    postProcess: async (memory: WorkingMemory, response: z.output<typeof params>) => {
      const { log  } = useActions()
      const calendarEvents = useSoulMemory<CalendarEvent[]>("calendarEvents", []);
      const calendar = new Calendar();
      calendarEvents.current.forEach(event => calendar.addEvent(event));
      const { startDate, endDate } = response;
      const eventsInRange = calendarEvents.current.filter(event => event.startDate >= startDate && event.endDate <= endDate);
      const eventsDisplay = `CALENDAR EVENTS RETRIEVED FROM ${startDate} TO ${endDate}:\n\n${calendar.displayEvents(eventsInRange)}`;
      log(eventsDisplay)

      const newMemory = {
        role: ChatMessageRoleEnum.Assistant,
        content: `${memory.soulName} viewed calendar events from ${startDate} to ${endDate}:\n${eventsDisplay}`
      };

      return [newMemory, eventsDisplay];
    }
  }
});

export { addCalendarTask, viewCalendar };