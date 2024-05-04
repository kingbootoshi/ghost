# GHOST 👻

GHOST is the ultimate, all in one AI soul that acts as the ultimate personal assistant.

like, JARVIS but he's actually your homie

# BOOTOSHI'S SOUL FUNCTIONALITY METHODS

## MASTER MEMORY

The main mental process he goes through is "core" which is located in initialProcess.ts

To make his workingMemory easy to manipulate, especially when editing his main memory from different mental processes, I made a "MASTER MEMORY" template that keeps track of his memory in a consistent manner so each slot is easy to work with and edit.

The position of where you put text/info matters, so I wanted to make sure it's super easy to manipulate it

Also, I transfer the content of memories around with useSoulMemory()

```javascript
  //THE MASTER TEMPLATE OF EVERYTHING NARRATIVE MEMORY MANIPULATION. RETURN THIS EDITED TEMPLATE FROM ALL OTHER MENTAL PROCESSES TO CONTINUE GAMEPLAY LOOP W/ UPDATED INFO
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
```

## SUB-AGENTS
An added buff of having a master memory, is we can easily control the memory of what I call "sub-agents" which are new, blank slated AI agent pipelines that accomplish a specific goal inside a soul's mind.

```javascript
  //Creating a sub-agent that decides if Ghost needs to use a tool
  let deciderMemory = new WorkingMemory({
    soulName: "Ghost",
    memories: [
      { role: ChatMessageRoleEnum.System, content: 
      `
      You are a sub-process of Ghost, the ultimate AI assistant.
  
      Before every single action, Ghost can decide to use a tool. You are the part of Ghost that picks if we need to use a tool.

      Your goal is to think & determine if the user's new action requires the use of a tool.
      ` 
    },
    recentProcessMemory,
    shortTermMemory,
    usersNewActionMemory,
    thoughtMemory
    ]
  })
```

The above is an example of making a blank workingMemory variable that analyzes the short term chat logs, new user action, and other memories to determine if ghost should use a tool. Because this fires off every single interaction, I want it to be as small & accurate as possible.

# ABILITIES & TOOLS

- Ghost first thinks about what you said before doing anything else. This helps him manage his own actions more efficiently

- Scratchpad sub-process to write whatever notes he wants for future interactions

- Summary sub-process to condense short term history every 5 interactions

- Can pick tools to use, such as
-> Calendar tool, which is linked with Todoist API that acts as calendar.

Every tool is handled in its own mental process as it requires a helper app to send/receieve data from external API calls and the mix. 
Having each tool be its own mental process is easier to handle.

# TO RUN
The soul runs 24/7 on Open Soul's server side when it's up, just make sure to have the helper app on or he will get stuck on mental processes when he switches. 

```bun client/index.ts```

(I think to combat bugs here, can have it so every non-core mental process has a countdown where, if there is no response from a client after X time, send him back to the core mental process)

## Made with Open Souls 
https://docs.souls.chat/