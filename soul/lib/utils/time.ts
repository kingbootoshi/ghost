export const getCurrentTimeString = (): string => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Los_Angeles',
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      weekday: 'long' // Added to include the name of the day
    };
    return now.toLocaleString('en-US', options);
  };