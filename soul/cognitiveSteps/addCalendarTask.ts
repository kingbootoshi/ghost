import { createCognitiveStep, WorkingMemory, ChatMessageRoleEnum, indentNicely, z } from "@opensouls/engine";

const addCalendarTask = createCognitiveStep((instructions: string) => {
  const params = z.object({
    content: z.string().describe('The natural language description of the calendar event.'),
    dueString: z.string().describe('The natural language description of when the task is due.')
  });

  return {
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        name: name,
        content: indentNicely`
          ${name} is adding a new calendar event.

          ${instructions}

          Please provide the following information:
          1. The content of the calendar event in natural language.
          2. The due date or time of the event in natural language.

          Examples of valid due date formats:
          - today
          - tomorrow
          - next week
          - jan 27
          - 01/27/2023
          - 6pm
          - in 5 days
          - Friday
          - tom morning

          Reply with the content and due date for the new calendar event.
        `
      };
    },
    schema: params,
    postProcess: async (memory: WorkingMemory, response: z.output<typeof params>) => {
      const { content, dueString } = response;
      const newMemory = {
        role: ChatMessageRoleEnum.Assistant,
        content: `${memory.soulName} added a new calendar event: "${content}" due ${dueString}.`
      };
      const eventDetails = { content, dueString };
      return [newMemory, eventDetails];
    }
  }
});

export default addCalendarTask;