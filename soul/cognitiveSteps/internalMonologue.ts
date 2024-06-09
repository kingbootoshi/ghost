import { createCognitiveStep, WorkingMemory, ChatMessageRoleEnum, indentNicely, stripEntityAndVerb, stripEntityAndVerbFromStream } from "@opensouls/engine";


const internalMonologue = createCognitiveStep((instructions: string | { instructions: string; verb: string }) => {
  let instructionString: string, verb: string;
  if (typeof instructions === "string") {
    instructionString = instructions;
    verb = "thought";
  } else {
    instructionString = instructions.instructions;
    verb = instructions.verb;
  }

  return {
    command: ({ soulName: name }: WorkingMemory) => {
      return {
        role: ChatMessageRoleEnum.System,
        name: name,
        content: indentNicely`
          ## Description
          ${instructionString}

          ## Rules
          * Internal monologue thoughts should match the speaking style of ${name}.
          * Only respond with the format '${name} ${verb}: "..."', no additional commentary or text.
          * Follow the Description when creating the internal thought!

          Please reply with the next internal monologue thought of ${name}. Use the format: '${name} ${verb}: "..."'
        `
      };
    },
    streamProcessor: stripEntityAndVerbFromStream,
    postProcess: async (memory: WorkingMemory, response: string) => {
      const stripped = stripEntityAndVerb(memory.soulName, verb, response);
      const newMemory = {
        role: ChatMessageRoleEnum.Assistant,
        content: `# ${memory.soulName.toUpperCase()} ${verb.toUpperCase()}: "${stripped}"`
      };
      return [newMemory, stripped];
    }
  }
})

export default internalMonologue
