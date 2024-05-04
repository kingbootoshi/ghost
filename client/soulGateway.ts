import { ActionEvent, Soul, SoulEvent } from "@opensouls/engine";
import { addTask, getTasks } from "./calendarTool";

export class SoulGateway {
  private soul: Soul;

  constructor() {
    this.soul = new Soul({
      organization: process.env.OPEN_SOULS_ORGANIZATION!,
      blueprint: "ghost",
      token: process.env.SOUL_ENGINE_API_KEY,
      soulId: process.env.SOUL_ID,
      debug: true,
    });

    this.onSoulEvent = this.onSoulEvent.bind(this);
    this.onCalendarTool = this.onCalendarTool.bind(this);
  }

  start() {
    this.soul.on("newSoulEvent", this.onSoulEvent);
    this.soul.on('calendarRequest', this.onCalendarTool);
    this.soul.connect();
  }

  stop() {
    return this.soul.disconnect();
  }

  onSoulEvent(evt: SoulEvent) {
    console.log("soul event!", evt);
  }

  async onCalendarTool(evt: ActionEvent) {
    console.log("calendar request!", evt);
  
    const functionName = evt._metadata?.['function'] as string | undefined;
    const parameters = evt._metadata?.parameters as Record<string, any> | undefined;
  
    if (functionName === "addEvent") {
      const { taskContent, dueString } = parameters || {};
      
      try {
        const addTaskReturn: string = await addTask(taskContent, dueString);
        console.log("Task added successfully!", addTaskReturn);
        this.soul.dispatch({
          action: 'calendarResponse',
          content: addTaskReturn,
      });
      } catch (error) {
        console.error("Error adding task:", error);
        //Dispatching error message to handle errors, and prompt ghost to potentially re-try.
        this.soul.dispatch({
          action: 'calendarResponse',
          content: "error occured, failed to add task to calendar. retry?",
      });
      }
    } else if (functionName === "retrieveCalendarEvents") {
      try {
        const tasks = await getTasks();
        console.log("Retrieved tasks:", tasks);
        this.soul.dispatch({
          action: 'calendarResponse',
          content: tasks,
      });
      } catch (error) {
        console.error("Error retrieving tasks:", error);
        this.soul.dispatch({
          action: 'calendarResponse',
          content: "error occured, failed to retrieve tasks from calendar. retry?",
      });
      }
    } else {
      console.warn("Unknown calendar function requested:", functionName);
    }
  }
}