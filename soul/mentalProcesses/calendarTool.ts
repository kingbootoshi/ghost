import { MentalProcess, useActions, useProcessManager, useSoulMemory, indentNicely, usePerceptions, ChatMessageRoleEnum } from "@opensouls/engine";
import decision from "../cognitiveSteps/decision.js";
import addCalendarTask from "../cognitiveSteps/addCalendarTask.js";
import core from "../initialProcess.js";

const calendarTool: MentalProcess = async ({ workingMemory }) => {
  const { speak, log, dispatch } = useActions();
  const { setNextProcess, invocationCount } = useProcessManager();
  const { invokingPerception, pendingPerceptions } = usePerceptions();
  const lastProcess = useSoulMemory("lastProcess", "diceRoll");
  const lastToolResult = useSoulMemory<string>("lastToolResult", "...");

  //INTRO CALENDAR STEP
  if (invocationCount === 0) {

    lastProcess.current = "calendarTool"

    //Logic on what to dispatch specifically

    //Pick the tool
    const [useAction, action] = await decision(workingMemory, {
      description: indentNicely`
        Based on the user query, what calendar action are you invoking?

        OPTIONS:
        1. retrieveCalendarEvents, which returns a string of information of the user's calendar
        - retrieveCalendarEvents should be used when you are trying to RETRIEVE schedules from the calendar

        2. addEvent, which adds a task/event to the user's calendar
        - addEvent should be used when you are trying to ADD schedules to the calendar
      `,
      choices: ["retrieveCalendarEvents", "addEvent"]
    },
    { model: "fast" }
    );

    log("Calendar action used:", action)

    if (action === "addEvent") {
      const [newMemory, eventDetails] = await addCalendarTask(
        workingMemory,
        "Add a new calendar event based on the user's request."
      );
      const { content, dueString } = eventDetails;

      // Dispatch the request for the calendar function
      dispatch({
        action: "calendarRequest",
        content: "Add Calendar Event",
        _metadata: {
          function: action,
          parameters: {
            taskContent: content,
            dueString: dueString
          }
        }
      });
    }

    if (action === "retrieveCalendarEvents") {
      // Dispatch the request for the calendar function
      dispatch({
        action: "calendarRequest",
        content: "Retrieve Calendar Events",
        _metadata: {
          function: action,
          parameters: {
            taskContent: "N/A",
            dueString: "N/A"
          }
        }
      });
    }

    log("Dispatched, waiting for calendar response before continuing");
    return workingMemory;
  } 
  
  //AWAITING CORRECT ACTION CALL FROM CLIENT
  if (invokingPerception && invokingPerception.action === "calendarResponse") {
    log("Calendar dispatch received! Sending information back to the core...");

    //Adding the result of the tool to our soul memory for the master memory to add
    lastToolResult.current = `THE CALENDAR TOOL WAS **JUST** USED, HERE IS THE RESULT:\n ${invokingPerception.content}\n\n**DO NOT USE THE CALENDAR TOOL AGAIN THIS INTERACTION**`;

    return [workingMemory, core, {executeNow: true}];
  }

  log("Calendar dispatch not received. Waiting for dispatch...");
  return workingMemory;
}

export default calendarTool;