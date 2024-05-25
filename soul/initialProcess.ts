import { MentalProcess, useActions, useProcessMemory, useProcessManager, useSoulMemory, indentNicely } from "@opensouls/engine";
import core from "./mentalProcesses/core.js";
import externalDialog from "./cognitiveSteps/externalDialog.js";
import decision from "./cognitiveSteps/decision.js";
import brainstorm from "./cognitiveSteps/brainstorm.js";

const characterCreation: MentalProcess = async ({ workingMemory }) => {
  const { speak, log } = useActions()
  const { invocationCount } = useProcessManager()
  const userName = useSoulMemory("userName", "")
  const userTimezone = useSoulMemory("userTimezone", "")

  // Check if userName is not empty
  if (userName.current !== "" && userTimezone.current !== "") {
    log("Stored name found, skipping character creation and returning to core");
    return [workingMemory, core, { executeNow: true }];
  }

  if (invocationCount === 0) {
    // On first message
    log("New user connected to Ghost");
  
    const [withIntro, intro] = await externalDialog(
      workingMemory,
      `[SYSTEM INSTRUCTIONS]: You are initiating a connection with a new user. Introduce yourself and explain your tools and capabilities, but do not offer to assist them yet. Focus on providing a clear and engaging introduction that highlights your unique features and skills.`,
      { model: "gpt-4o" }
    );
  
    speak(intro);

    const [withName, askName] = await externalDialog(
      withIntro,
      `[SYSTEM INSTRUCTIONS]: ASK THE USER FOR THEIR NAME, starting with "btw...". Mention they should choose wisely as there's no way to change it later because bootoshi was lazy.`,
      { model: "gpt-4o" }
    );

    speak(askName)

    return withName;
  }

  if (userName.current == "") {
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
    `Got name. User's name is ${finalName}. Ask the user to pick their timezone from the following options explicitly: PT/CT/ET`,
    { model: "gpt-4o" }
  );

  speak(repeatName)
  return withRepeat
  }

  const [pickTimezone, timeZone] = await decision(
    workingMemory,
    {
      description: "Pick & finalize the users timezone. ",
      choices: ["PT", "CT", "ET", "no_timezone_mentioned"]
    }, 
    { model: "gpt-4o" }
  )

  log("User picked timezone", timeZone)

  if(timeZone === "no_timezone_mentioned"){
    const [withRepeatTimezone, repeatTimezone] = await externalDialog(
      workingMemory,
      `The User DID NOT give you a timezone that fit PT/CT/ET. Ask for their timezone again! We need a timezone before continuing. Tell them to PICK: PT/CT/ET`,
      { model: "gpt-4o" }
    );

    speak(repeatTimezone)

    return withRepeatTimezone
  }

  userTimezone.current = timeZone

  const [withFinalize, finalize] = await externalDialog(
    workingMemory,
    `Got timezone. Tell the user you are ready to assist them!`,
    { model: "gpt-4o" }
  );

  speak(finalize)

  return [workingMemory, core]
};

export default characterCreation