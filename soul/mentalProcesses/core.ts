
import { MentalProcess, useActions, useSoulMemory, ChatMessageRoleEnum, WorkingMemory, indentNicely, z, usePerceptions } from "@opensouls/engine";
import externalDialog from "../cognitiveSteps/externalDialog.js";
import internalMonologue from "../cognitiveSteps/internalMonologue.js";
import decision from "../cognitiveSteps/decision.js";
import calendarTool from "./calendarTool.js";
import { getCurrentTimeString } from "../lib/utils/time.js";
import { scheduleDailyReengagements } from "../lib/utils/dailyReminder.js";
import { viewCalendar } from "../cognitiveSteps/calendar.js";

const core: MentalProcess = async ({ workingMemory }) => {
  const { speak, log  } = useActions()
  const { invokingPerception, pendingPerceptions } = usePerceptions();
  const newUserAction = useSoulMemory<string>("newUserAction", "...");
  const userName = useSoulMemory("userName", "")
  const userSaid = useSoulMemory<string>("userSaid", "...");
  const userTimezone = useSoulMemory<string>("userTimezone", "PT");
  const lastProcess = useSoulMemory("lastProcess", "core");
  const toolThoughtMemory = useSoulMemory("toolThoughtMemory", "...");
  const scratchpadNotes = useSoulMemory<string>("scratchpadNotes", "Empty scratchpad");
  const lastToolResult = useSoulMemory<string>("lastToolResult", "...");
  const shortTermChatLogs = useSoulMemory<string[]>("shortTermChatLogs", []);
  const longtermHistory = useSoulMemory<string[]>("longtermHistory", []);
  const shortTermHistoryString = shortTermChatLogs.current.map((item, index) => {
    return `${index + 1}. ${item}`;
  }).join("\n\n");
  const longTermHistoryString = longtermHistory.current.slice().reverse().slice(-10).reverse().filter(narrative => narrative != null).map((narrative, index) => {
    return `${index + 1}. ${narrative.trim()}`;
  }).join("\n\n");
  const currentTimeString = getCurrentTimeString(userTimezone.current as "PT" | "CT" | "ET" | "UTC" | undefined);
  const dailyRemindersScheduled = useSoulMemory<boolean>("dailyRemindersScheduled", false);
  // Schedule daily re-engagements if not already scheduled
  if (!dailyRemindersScheduled.current) {
    const scheduledTimes = scheduleDailyReengagements();
    log('Morning reminder scheduled at:', scheduledTimes.morning);
    log('Evening reminder scheduled at:', scheduledTimes.evening);
    dailyRemindersScheduled.current = true;
  }

  let usersNewActionMemory;
  
  // SETTING UP WORKING MEMORY TEMPLATE FOR EASY MANIPULATION
  //Recent Process Memory
  let recentProcessMemory = {
    role: ChatMessageRoleEnum.Assistant, 
    content: `## USER'S NAME: ${userName.current}\n\n## CURRENT TIME\n${currentTimeString} ${userTimezone.current}\n\n## MEMORY UPDATE: RECENT PROCESS/ACTIONS\n\n<SYSTEM>\n${lastToolResult.current}\n</SYSTEM>`,
  };

  //Wiping tool memory after adding the last one to memory to ensure freshness
  lastToolResult.current = "NO NEW MEMORY UPDATES."

  //Long Term Narrative Memory
  let longTermMemory = {
    role: ChatMessageRoleEnum.Assistant, 
    content: `## LONG TERM HISTORY\n\n${longTermHistoryString}`,
  };

  //Short Term Chat Memory
  let shortTermMemory = {
    role: ChatMessageRoleEnum.Assistant, 
    content: `## SHORT TERM CHAT HISTORY\n\n${shortTermHistoryString}`,
  };

  //Scratchpad Memory
  let scratchpadMemory = {
    role: ChatMessageRoleEnum.Assistant, 
    content: `## GHOST'S SCRATCHPAD NOTES\n${scratchpadNotes.current}`,
  };

  if (lastProcess.current === "core"){
    // User's New Action Memory
    usersNewActionMemory = {
      role: ChatMessageRoleEnum.Assistant, 
      content: `${newUserAction.current}`,
    };
  } else {
    // User's New Action Memory
    usersNewActionMemory = {
      role: ChatMessageRoleEnum.Assistant, 
      content: `## PREVIOUS PERCEPTION THAT ACTIVATED ${lastProcess.current} MENTAL PROCESS:\n${newUserAction.current}\n\nNOTE: You JUST came back from the ${lastProcess.current} mental process. Proceed forward`,
    };
  };

  lastProcess.current = "core";

  //THE CORE, MASTER TEMPLATE OF GHOST'S WORKING MEMORY
  let masterMemory = new WorkingMemory({
    soulName: "Ghost",
    memories: [
      workingMemory.memories[0], //[0] IS THE BASE PROMPT FROM GHOST.MD
      scratchpadMemory, //[1] IS GHOST'S SCRATCHPAD NOTES
      longTermMemory, //[2] IS THE LONG TERM CHAT HISTORY SUMMED UP
      shortTermMemory, //[3] IS THE SHORT TERM CHAT LOGS
      recentProcessMemory, //[4] IS WHAT WE ADD WHEN COMING BACK FROM OTHER MENTAL PROCESSES TO INFORM GHOST OF ACTIONS HES DONE IN DIFFERENT BRAINS
      usersNewActionMemory //[5] IS THE USERS'S NEW ACTION
    ]
  })

  //RESPONDING TO THE USER LOGIC WITH "SAID" PERCEPTION
  if(invokingPerception?.action === "said"){
  // //FEEL LOGIC
  // const [withFeelings, feelings] = await internalMonologue(
  //   masterMemory,
  //   { instructions: "WHAT FEELING HAS INVOKED IN GHOST IN ONE WORD? GHOST FEELS:", verb: "feels" },
  //   { model: "fast" }
  // );

  // log("Ghost feels...", feelings)

  //THINK LOGIC
  const [withThoughts, thought] = await internalMonologue(
    masterMemory,
    { instructions: "Formulate a thought before speaking", verb: "thinks" },
    { model: "exp/llama-v3-70b-instruct" }
  );

  log("Ghost thinks...", thought)

  // SELECT TOOL USE LOGIC
  //Think about using a tool
  const [thinkOfAction, actions] = await internalMonologue(
    withThoughts, 
    indentNicely`
      Based on the user's new action, is the use of a tool required?

      PAY HEAVY ATTENTION TO ANY MEMORY UPDATES! 

      ### Available Tools:
      - Calendar: Access user's calendar to view, add, or remove events. Use when user mentions an event or time. 
      Example: "I have a meeting at 12pm" -> add meeting to calendar
      
      If no tool is required, pick no_tool by defualt.

      IMPORTANT: EXPLICITLY THINK IN FIRST PERSON TO ANALYZE THE CURRENT SCENERIO. START YOUR SENTENCE BY STATING: "I think..."
    `, { model: "exp/llama-v3-70b-instruct" });

  log("Ghost thinks about tool usage:", actions)

  toolThoughtMemory.current = actions

  //Pick the tool
  const [useAction, action] = await decision(thinkOfAction, {
    description: indentNicely`
      Based on your analysis of "I think...", which of the following tools should Ghost proceed with?
    `,
    choices: ["calendar_tool", "no_tool"]
  },
  { model: "fast" }
  );

  log("Ghost picks a tool:", action)

  if(action == "calendar_tool"){
    //Adding a memory informing the calendar tool was used
    masterMemory = masterMemory.withMemory(
      {
      role: ChatMessageRoleEnum.System,
      content: `## THE CALENDAR TOOL WAS REQUESTED\n\n GHOST'S REASON: ${actions}`
      }
    )
    return [masterMemory, calendarTool, { executeNow: true }]
  }

  // CHAT LOGIC
  const [withDialog, result] = await externalDialog(
    withThoughts,
    "Interact with the user",
    {model: "gpt-4o" }
  );

  speak(result);

  //PUSH CONVO TO SHORT TERM HISTORY
  const [day, date, time] = getCurrentTimeString().split(', '); // Extracting the date and time parts
  shortTermChatLogs.current.push(`${date} ${time} ${userTimezone.current}\nUser said: ${userSaid.current}\nGhost said: ${result}`);

  return withDialog;
  }

//RESPONDING TO THE USER wITH CURRENT WORKING MEMORY WHICH CONTAINS NEW PERCEPTION MEMORIES THAT ARE NOT "SAID"
if(invokingPerception?.action === "remind"){
  const reminder = invokingPerception?.content
  const [withDialog, result] = await externalDialog(
    workingMemory,
    indentNicely`# [SYSTEM]: REMINDER PING RECEIVED!\n ${reminder},\n PLEASE SPEAK TO REMIND THE USER!`,
    {model: "gpt-4o" }
  );

  speak(result)

  //PUSH CONVO TO SHORT TERM HISTORY
  const [day, date, time] = getCurrentTimeString().split(', '); // Extracting the date and time parts
  shortTermChatLogs.current.push(`${date} ${time} ${userTimezone.current}\nUser said: [ N/A ]\nGHOST SAID: ${result}`);

  return workingMemory
}

  //LOGIC FOR GOODMORNING/GOODNIGHT PERCEPTIONS. MOVE TO ITS OWN MENTAL PROCESS MAYBE?
  //RESPONDING TO GOODMORNING PERCEPTIONS
  if(invokingPerception?.action === "goodmorning"){
    const [viewedEventMemory, viewedEvent] = await viewCalendar(
      workingMemory,
      `Find calendar events today. NEW CURRENT TIME: ${currentTimeString}`,
      {model: "fast"}
    );

    const [withDialog, result] = await externalDialog(
      workingMemory,
      indentNicely`
      ${viewedEvent}
      Tell the user goodmorning and tell them today's schedule! `,
      {model: "gpt-4o" }
    );

    speak(result)

    //PUSH CONVO TO SHORT TERM HISTORY
    const [day, date, time] = getCurrentTimeString().split(', '); // Extracting the date and time parts
    shortTermChatLogs.current.push(`${date} ${time} ${userTimezone.current}\nUser said: [ N/A ]\nGHOST SAID: ${result}`);

    return workingMemory
  }

  //RESPONDING TO GOODNIGHT PERCEPTIONS
  if(invokingPerception?.action === "goodnight"){
    const [viewedEventMemory, viewedEvent] = await viewCalendar(
      workingMemory,
      `Find calendar events for tomorrow. NEW CURRENT TIME: ${currentTimeString}`,
      {model: "fast"}
    );

    const [withDialog, result] = await externalDialog(
      workingMemory,
      indentNicely`
      ${viewedEvent}
      Tell the user goodnight and tell them tomorrow's schedule! `,
      {model: "gpt-4o" }
    );

    speak(result)

    //PUSH CONVO TO SHORT TERM HISTORY
    const [day, date, time] = getCurrentTimeString().split(', '); // Extracting the date and time parts
    shortTermChatLogs.current.push(`${date} ${time} ${userTimezone.current}\nUser said: [ N/A ]\nGHOST SAID: ${result}`);

    dailyRemindersScheduled.current = false;

    return workingMemory
  }
}

export default core