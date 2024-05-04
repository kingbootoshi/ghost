
import { MentalProcess, useActions, useSoulMemory, ChatMessageRoleEnum, WorkingMemory, indentNicely } from "@opensouls/engine";
import externalDialog from "./cognitiveSteps/externalDialog.js";
import internalMonologue from "./cognitiveSteps/internalMonologue.js";
import decision from "./cognitiveSteps/decision.js";
import calendarTool from "./mentalProcesses/calendarTool.js";

const core: MentalProcess = async ({ workingMemory }) => {
  const { speak, log  } = useActions()
  const newUserAction = useSoulMemory<string>("newUserAction", "...");
  const lastProcess = useSoulMemory("lastProcess", "core");
  const scratchpadNotes = useSoulMemory<string>("scratchpadNotes", "Empty scratchpad");
  const lastToolResult = useSoulMemory<string>("lastToolResult", "...");
  const shortTermChatLogs = useSoulMemory<string[]>("shortTermChatLogs", []);
  const longtermHistory = useSoulMemory<string[]>("longtermHistory", []);
  const shortTermHistoryString = shortTermChatLogs.current.map((item, index) => `${index + 1}. ${item}`).join("\n\n")
  const longTermHistoryString = longtermHistory.current.slice().reverse().slice(-10).reverse().filter(narrative => narrative != null).map(narrative => narrative.trim()) .join("\n\n"); 

  lastProcess.current = "core"
  // SETTING UP WORKING MEMORY TEMPLATE FOR EASY MANIPULATION

  //Recent Process Memory
  let recentProcessMemory = {
    role: ChatMessageRoleEnum.Assistant, 
    content: `## RECENT PROCESS/ACTIONS\n\n${lastToolResult.current}`,
  };

  //Wiping tool memory after adding the last one to memory to ensure freshness
  lastToolResult.current = ""

  //Long Term Narrative Memory
  let longTermMemory = {
    role: ChatMessageRoleEnum.Assistant, 
    content: `## LONG TERM HISTORY\n\n${longTermHistoryString}`,
  };

  //Short Term Chat Memory
  let shortTermMemory = {
    role: ChatMessageRoleEnum.Assistant, 
    content: `## SHORT TERM CHAT LOGS\n\n${shortTermHistoryString}`,
  };

  //Scratchpad Memory
  let scratchpadMemory = {
    role: ChatMessageRoleEnum.Assistant, 
    content: `## GHOST'S SCRATCHPAD NOTES\n${scratchpadNotes.current}`,
  };

  // User's New Action Memory
  let usersNewActionMemory = {
    role: ChatMessageRoleEnum.Assistant, 
    content: `## USER'S NEW ACTION\n${newUserAction.current}`,
  };

  //THE CORE, MASTER TEMPLATE OF GHOST'S WORKING MEMORY
  let masterMemory = new WorkingMemory({
    soulName: "Ghost",
    memories: [
      workingMemory.memories[0], //[0] IS THE BASE PROMPT FROM GHOST.MD
      recentProcessMemory, //[1] IS WHAT WE ADD WHEN COMING BACK FROM OTHER MENTAL PROCESSES TO INFORM GHOST OF ACTIONS HES DONE IN DIFFERENT BRAINS
      longTermMemory, //[2] IS THE LONG TERM CHAT HISTORY SUMMED UP
      shortTermMemory, //[3] IS THE SHORT TERM CHAT LOGS
      scratchpadMemory,//[4] IS GHOST'S SCRATCHPAD NOTES
      usersNewActionMemory //[5] IS THE USERS'S NEW ACTION
    ]
  })

  //THINK LOGIC
  const [withThoughts, thought] = await internalMonologue(
    masterMemory,
    "Think before you speak",
    {model: "fast" }
  );

  log("Ghost thinks...", thought)

  // User's New Action Memory
  let thoughtMemory = {
    role: ChatMessageRoleEnum.Assistant, 
    content: `## GHOST MAIN BRAIN THINKS\n${thought}`,
  };

  // SELECT TOOL USE LOGIC
  //Creating a sub-agent that decides if Ghost needs to use a tool
  let deciderMemory = new WorkingMemory({
    soulName: "Ghost",
    memories: [
      { role: ChatMessageRoleEnum.System, content: 
      `
      You are a sub-process of Ghost, the ultimate AI assistant.
  
      Before every single action, Ghost can decide to use a tool. You are the part of Ghost that picks if you need to use a tool.

      Your goal is to think & determine if the user's new action requires the use of a tool.

      TAKE INTO HEAVY ACCOUNT THE USERS NEW ACTION !!!

      PAY ATTENTION TO YOUR RECENT PROCESS/ACTIONS MEMORY, IT SHOWS WHAT TOOL YOU USED IN THE PREVIOUS LOOP!
      ` 
    },
    shortTermMemory,
    usersNewActionMemory,
    thoughtMemory,
    recentProcessMemory,
    ]
  })

  //Think about using a tool
  const [thinkOfAction, actions] = await internalMonologue(deciderMemory, `
  Based on the user's new action, is the use of a tool required?

  ### Available Tools:
  - Calendar: ONLY useful for access the users calendar to view, add, or remove info. Unless specifically asked for, ignore this.

  Usually the user will just tell you stuff he's doing and a time, which means add it to the calendar.
  ex. "i have a meeting at 12pm" means "please add this meeting to my calendar"

  You NEED to use this tool to access the calendar.
  
  If no tool is required, pick no_tool by defualt.

  IMPORTANT: EXPLICITLY THINK IN FIRST PERSON TO ANALYZE THE CURRENT SCENERIO. START YOUR SENTENCE BY STATING: "I think..."
`, { model: "fast" });

log("Ghost thinks about tool usage:", actions)

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
    "Say whatever you want",
    {model: "quality" }
  );

  speak(result);

  //PUSH CONVO TO SHORT TERM HISTORY
  //Pushing the player's current action & GM's narrative to the short term memory
  shortTermChatLogs.current.push(`//USER INTERACTION\n${newUserAction.current}\n\n//GHOST REPLIED:\n${result}`);

  return masterMemory;
}

export default core