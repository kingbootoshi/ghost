import { createCognitiveStep, WorkingMemory, ChatMessageRoleEnum, indentNicely, z, useSoulMemory, useActions} from "@opensouls/engine";
import core from "../../mentalProcesses/core.js";

export function scheduleDailyReengagements() {
    const { scheduleEvent, log } = useActions();
    const coreProcess = core;

    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Los_Angeles'
    });

    const createReminderTime = (hours: number, minutes: number, timeZone: string) => {
        const reminderTime = new Date();
        reminderTime.setUTCHours(hours + (timeZone === 'PST' ? 8 : 0), minutes, 0, 0); // Adjusting for PST
        return reminderTime;
    };

    const morningReminderTime = createReminderTime(9, 0, 'PST'); // 10:00 AM PST
    const eveningReminderTime = createReminderTime(21, 0, 'PST'); // 10:00 PM PST

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
            timeZone: 'America/Los_Angeles'
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
            timeZone: 'America/Los_Angeles'
        }),
        evening: eveningReminderTime.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'America/Los_Angeles'
        })
    };
}