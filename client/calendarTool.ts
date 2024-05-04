import { TodoistApi } from "@doist/todoist-api-typescript"

const todoist = new TodoistApi(process.env.TODOIST_API_KEY!);
      
function formatDate(date: Date, hasTime: boolean): string {
  if (hasTime) {
    return date.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  } else {
    // Set the time to noon (12:00:00) to avoid time zone adjustments
    date.setHours(12, 0, 0, 0);

    return date.toLocaleString('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: 'numeric'
    });
  }
}

export async function getTasks() {
  const tasks = await todoist.getTasks({});
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to midnight for comparison

  const outdatedTasks: string[] = [];
  const todaysTasks: string[] = [];
  const upcomingTasks: string[] = [];

  tasks.forEach(task => {
    const { content, due } = task;
    let formattedDate = '';

    if (due) {
      const dueDate = due.datetime ? new Date(due.datetime) : new Date(due.date!);
      const hasTime = !!due.datetime;

      if (dueDate < today) {
        formattedDate = formatDate(dueDate, hasTime);
        outdatedTasks.push(`${content} - ${formattedDate}`);
      } else if (dueDate.getDate() === today.getDate()) {
        formattedDate = formatDate(dueDate, hasTime);
        todaysTasks.push(`${content} - ${formattedDate}`);
      } else {
        formattedDate = formatDate(dueDate, hasTime);
        upcomingTasks.push(`${content} - ${formattedDate}`);
      }
    }
  });

  const formattedOutput = `
  Outdated Tasks:
  ${outdatedTasks.join('\n')}

  Today's Tasks:
  ${todaysTasks.join('\n')}

  Upcoming Tasks:
  ${upcomingTasks.join('\n')}
    `;

  console.log(formattedOutput);
  return formattedOutput
}

export async function addTask(content: string, dueString: string): Promise<string> {
  try {
    const task = await todoist.addTask({
      content,
      dueString
    });
    console.log('Task added successfully:', task);
    return `Task "${content}" added successfully with due date ${dueString}`;
  } catch (error) {
    console.error('Error adding task:', error);
    return `Error adding task: ${error.message}`;
  }
}