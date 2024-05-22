import { MentalProcess, useActions, useProcessManager, useSoulMemory, indentNicely, usePerceptions, ChatMessageRoleEnum } from "@opensouls/engine";
import decision from "../cognitiveSteps/decision.js";
import { addCalendarTask, viewCalendar } from "../cognitiveSteps/calendar.js";
import core from "./core.js";

const calendarTool: MentalProcess = async ({ workingMemory }) => {
  const { speak, log, dispatch } = useActions();
  const { invocationCount } = useProcessManager();
  const { invokingPerception, pendingPerceptions } = usePerceptions();
  const toolThoughtMemory = useSoulMemory("toolThoughtMemory", "...");
  const lastProcess = useSoulMemory("lastProcess", "diceRoll");
  const lastToolResult = useSoulMemory<string>("lastToolResult", "...");

  lastProcess.current = "calendarTool"

  const [decideAction, action] = await decision(workingMemory, {
    description: `* SYSTEM: Hello Ghost, Choose the calendar action you wish to access based on your previous thought: ${toolThoughtMemory.current}`,
    choices: ["add_event", "view_events", "delete_event"]
  });

  log("Calendar action picked:", action)

  //ADD EVENT TO SOUL CALENDAR LOGIC
  if (action === "add_event"){
  const [, addedEvent] = await addCalendarTask(
    workingMemory,
    "Add a new calendar event based on the user's request.",
    {model: "fast"}
  );

  //Adding the result of the tool to our soul memory for the master memory to add
  lastToolResult.current = `GHOST, your ADD CALENDAR tool was **JUST** used. Here are the key details to integrate into your current context:\n\nCALENDAR EVENT ADDED:\n${addedEvent}\n\nINSTRUCTIONS:\nInform the user the event was successfully added!`;
}

//VIEW EVENTS SOUL LOGIC
if (action === "view_events"){

  const [, viewedEvent] = await viewCalendar(
    workingMemory,
    "Find calendar events based on the user's request.",
    {model: "fast"}
  );
  
  lastToolResult.current = `GHOST, your VIEW CALENDAR tool was **JUST** used. Here are the key details to integrate into your current context:\n\n${viewedEvent}`;
}

  return [workingMemory, core, { executeNow: true }]
}

export default calendarTool;