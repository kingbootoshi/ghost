
import { ChatMessageRoleEnum, MentalProcess, WorkingMemory, createCognitiveStep, indentNicely, useActions, useSoulMemory } from "@opensouls/engine";


const scratchpad = createCognitiveStep((existing: string) => {
  return {
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        content: indentNicely`
        ## Instructions for Ghost

        Ghost, this scratchpad is your personal workspace to assist you plan future interactions

        1. Write any random thoughts you have
        2. Keep track of notes

        Organize the scratchpad with clear headings (starting with ###), bullet points, and concise notes f or easy reference and updating.

        Leverage this scratchpad to plan ahead!

        Keep it super concise, the scratchpad should be small!

        This scratchpad updates every interaction, so re-write information you need to keep.

        Scratchpad: 
        `,
      }
    },
  }
})

const takeNotes: MentalProcess = async ({ workingMemory }) => {
  const { log } = useActions()
  const scratchpadNotes = useSoulMemory<string>("scratchpadNotes", "Empty scratchpad");
  const lastProcess = useSoulMemory("lastProcess");
  const interactionCount = useSoulMemory<number>("interactionCount", 0);

  //Only activate scratchpad on core mental process. Thanks Tom !!
  if (lastProcess.current === "core" && interactionCount.current === 0){
  const [, updatedNotes] = await scratchpad(workingMemory, "", {model: "exp/llama-v3-70b-instruct"})
  log("Ghost updates scratchpad:", updatedNotes);

  scratchpadNotes.current = updatedNotes
  }

  return workingMemory;
  }

export default takeNotes