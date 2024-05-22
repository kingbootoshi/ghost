export const getCurrentTimeString = (timezone: 'PT' | 'CT' | 'ET' = 'ET'): string => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        weekday: 'long' // Added to include the name of the day
    };

    let timeZoneString: string;
    switch (timezone) {
        case 'PT':
            timeZoneString = 'America/Los_Angeles';
            break;
        case 'CT':
            timeZoneString = 'America/Chicago';
            break;
        case 'ET':
        default:
            timeZoneString = 'America/New_York';
            break;
    }

    return now.toLocaleString('en-US', { ...options, timeZone: timeZoneString });
};

console.log(getCurrentTimeString("PT"))