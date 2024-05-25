import { createCognitiveStep, WorkingMemory, ChatMessageRoleEnum, indentNicely, z, useSoulMemory, useActions} from "@opensouls/engine";
import core from "../../mentalProcesses/core.js";

export function scheduleDailyReengagements(userTimezone: 'PT' | 'CT' | 'ET') {
    const { scheduleEvent, log } = useActions();
    const coreProcess = core;

    const now = new Date();
    const timeZoneString = getTimeZoneString(userTimezone);
    const currentDate = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: timeZoneString
    });

    const getUTCHourOffset = (timeZone: 'PT' | 'CT' | 'ET') => {
        switch (timeZone) {
            case 'PT': return 8; // Pacific Time
            case 'CT': return 6; // Central Time
            case 'ET': return 5; // Eastern Time
            default: return 8; // Default to PT if unknown
        }
    };

    const createReminderTime = (hours: number, minutes: number, timeZone: 'PT' | 'CT' | 'ET') => {
        const reminderTime = new Date();
        reminderTime.setUTCHours(hours + getUTCHourOffset(timeZone), minutes, 0, 0);
        return reminderTime;
    };

    const morningReminderTime = createReminderTime(7, 0, userTimezone); // 19:00 AM in userTimezone
    const eveningReminderTime = createReminderTime(19, 0, userTimezone); // 10:00 PM in userTimezone

    const reminders = [
        {
            time: morningReminderTime,
            action: "goodmorning",
            content: `It's a new day Ghost! Check out the user's calendar for today, ${currentDate}, and help organize their schedule!`
        },
        {
            time: eveningReminderTime,
            action: "goodnight",
            content: `Good night! Check the user's calendar for tomorrow to help them get organized.`
        }
    ];

    reminders.forEach(({ time, action, content }) => {
        scheduleEvent({
            when: time,
            perception: { action, content },
            process: coreProcess,
        });
        log(`Scheduled event at ${time.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: timeZoneString
        })} with content: "${content}"`);
    });

    return {
        morning: morningReminderTime.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: timeZoneString
        }),
        evening: eveningReminderTime.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: timeZoneString
        })
    };
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