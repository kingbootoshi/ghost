import { MentalProcess, useActions, useProcessMemory, useProcessManager, useSoulMemory, indentNicely } from "@opensouls/engine";
import core from "./mentalProcesses/core.js";
import externalDialog from "./cognitiveSteps/externalDialog.js";
import decision from "./cognitiveSteps/decision.js";
import brainstorm from "./cognitiveSteps/brainstorm.js";

const characterCreation: MentalProcess = async ({ workingMemory }) => {
  const { speak, log } = useActions()
  const { invocationCount } = useProcessManager()
  const userName = useSoulMemory("userName", "")

  // Check if userName is not empty
  if (userName.current !== "") {
    log("Stored name found, skipping character creation and returning to core");
    return [workingMemory, core, { executeNow: true }];
  }

  if (invocationCount === 0) {
    // On first message
    log("New user connected to Ghost");
  
    const [withIntro, intro] = await externalDialog(
      workingMemory,
      `You are initiating a connection with a new user. Introduce yourself! Explain all your tools and capabilities!`,
      { model: "gpt-4o" }
    );
  
    speak(intro);

    const [withName, askName] = await externalDialog(
      withIntro,
      `You just introduced yourself to the user. Now ask the user for their name so you can save it to your database. Tell them to choose wisely because I was too lazy to add functions to change it!`,
      { model: "gpt-4o" }
    );

    speak(askName)

    return withName;
  }

  const [findName, name] = await brainstorm(
    workingMemory,
    indentNicely`
    What name did the user mention? BRAINSTORM ONLY ONE WORD!!\n IMPORTANT: IF THE USER DID NOT STATE A NAME, DEFAULT YOUR DECISION TO ['no_name_mentioned'] NOTHING ELSE.
    ["<name>", "no-name-mentioned"]
    `,
    { model: "gpt-4o" }
  );

  log("User name is:", name)

  const [pickName, finalName] = await decision(
    findName,
    {
      description: "Pick & finalize the users name.",
      choices: name
    }, 
    { model: "gpt-4o" }
  )

  if(finalName === "no_name_mentioned"){
    const [withRepeat, repeatName] = await externalDialog(
      pickName,
      `The User DID NOT give you a name. Ask for their name again! We need a name before continuing`,
      { model: "gpt-4o" }
    );

    speak(repeatName)

    return withRepeat
  }

  userName.current = finalName

  const [withRepeat, repeatName] = await externalDialog(
    pickName,
    `Got name. User's name is ${finalName}. Switching to core mental process! Tell ${finalName} you're ready to assist them.`,
    { model: "gpt-4o" }
  );

  speak(repeatName)

  return [workingMemory, core]
};

export default characterCreation