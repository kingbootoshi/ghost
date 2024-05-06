
import { ChatMessageRoleEnum, MentalProcess, WorkingMemory, createCognitiveStep, indentNicely, stripEntityAndVerb, stripEntityAndVerbFromStream, useActions, useProcessMemory, useSoulMemory, useProcessManager } from "@opensouls/engine";
import internalMonologue from "../cognitiveSteps/internalMonologue.js";

const summarizeConvo: MentalProcess = async ({ workingMemory }) => {
  const { log } = useActions()
  const shortTermChatLogs = useSoulMemory<string[]>("shortTermChatLogs", []);
  const longtermHistory = useSoulMemory<string[]>("longtermHistory", []);

  // Check if tempHistory has 5 narratives saved to summarize
  if (shortTermChatLogs.current.length >= 5) {
    log("Reached more than 5 objects in the short term chat logs. Summarizing...")

    //Creating a sub-ai agent to summarize the narrative
    const cleanMemory = new WorkingMemory({
      soulName: "Ghost",
      memories: [
        {
          role: ChatMessageRoleEnum.System,
          content: indentNicely`
            You are a sub-process of Ghost, the ultimate AI assistant

            You have access to the short term chat logs between Ghost and the user

            Your goal is to summarize the chatlogs
          ` 
        },
        workingMemory.memories[3] //Short term history memory
      ]
    })

    const [withSummedChat, summmedChat] = await internalMonologue(
      cleanMemory, 
      "Summarize the short term chat logs into a very concise, brief summary that contains the most important information", 
      { model: "fast" }
    );

    log("Chatlog summarized: ", summmedChat)

    // Save the summarized story to longtermHistory.current
    longtermHistory.current.push(summmedChat);

    // Empty the tempHistory object
    shortTermChatLogs.current = []; 

    return workingMemory;
  }

  return workingMemory;
  }

export default summarizeConvo