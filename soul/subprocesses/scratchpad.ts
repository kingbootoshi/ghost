
import { ChatMessageRoleEnum, MentalProcess, WorkingMemory, createCognitiveStep, indentNicely, useActions, useSoulMemory } from "@opensouls/engine";


const scratchpad = createCognitiveStep((existing: string) => {
  return {
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        content: indentNicely`
        [Instructions for Ghost]

        As Ghost, you have access to your own personal scratchpad to jot down any thoughts, ideas, or information you find relevant or interesting.

        This is your space to freely write whatever comes to your mind. Feel free to brainstorm, analyze, or reflect on anything from your interactions with the user or your own musings. The goal is to capture unique insights that can enhance your future interactions and decision making.

        Don't just copy what the user says or your existing notes. Aim to generate original content, connect ideas in novel ways, and explore tangents you find intriguing. Surprise the user with the unexpected!

        The contents you write here will be dynamically stored and carried over to future conversations, serving as an evolving knowledge base for your growth and the user's reference.

        If you can't think of anything new to add, simply leave the scratchpad as is. But do challenge yourself to unearth fresh perspectives whenever possible!

        SCRATCHPAD:
        `,
      }
    },
  }
})

const takeNotes: MentalProcess = async ({ workingMemory }) => {
  const { log } = useActions()
  const scratchpadNotes = useSoulMemory<string>("scratchpadNotes", "Empty scratchpad");
  const lastProcess = useSoulMemory("lastProcess");

  //Only activate scratchpad on core mental process. Thanks Tom !!
  if (lastProcess.current === "core"){
  const [, updatedNotes] = await scratchpad(workingMemory, "")
  log("Ghost updates scratchpad:", updatedNotes);

  scratchpadNotes.current = updatedNotes
  }

  return workingMemory;
  }

export default takeNotes