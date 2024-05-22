import { ChatMessageRoleEnum, InputMemory, Memory, PerceptionProcessor, useActions, useSoulMemory } from "@opensouls/engine"
 
function safeName(name?: string) {
  return (name || "").replace(/[^a-zA-Z0-9_-{}]/g, '_').slice(0, 62);
}
 

const perceptionProcessor: PerceptionProcessor = async ({ perception, workingMemory, currentProcess }) => {
  const { log } = useActions()
  const userName = useSoulMemory("userName", "Bootoshi") //Replace with your own name
  const newUserAction = useSoulMemory<string>("newUserAction", "..."); 
  const userSaid = useSoulMemory<string>("userSaid", "...");
  const name = userName.current ? userName.current : perception.name
 
  let content = `# NEW PERCEPTION RECEIVED\n* ACTION: ${perception.action}\n* CONTENT: ${perception.content}`
  const memory: InputMemory = {
    role: perception.internal ? ChatMessageRoleEnum.Assistant : ChatMessageRoleEnum.User,
    content,
    ...(name ? { name: safeName(name) } : {}),
    metadata: {
      ...perception._metadata,
      timestamp: perception._timestamp
    }
  }

  //if it's a said, we take this action (default is said) into account in the master template
  if (perception.action === "said"){
  content = `${name} ${perception.action}: ${perception.content}`
  newUserAction.current = content
  userSaid.current = perception.content
  return [workingMemory, currentProcess]
  }
  
  //otherwise just return
  workingMemory = workingMemory.withMemory(memory)
 
  return [workingMemory, currentProcess]
}
 
export default perceptionProcessor