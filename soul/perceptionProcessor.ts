import { PerceptionProcessor, useActions, useSoulMemory } from "@opensouls/engine"
 
//THIS ENTIRE PERCEPTION PROCESSOR DOES NOT ADD NEW PERCEPTIONS TO THE MEMORY BUT RATHER UPDATES A SOUL MEMORY WITH THE PERCEPTION FOR EASE OF MANIPULATION
//Usually a new perception is added to working memory, but this is easier for memory manipulation (for me imo)
//Needs to have an if statement that checks specifically if a user sent in a perception so its not mixed in with tool perceptions.

const perceptionProcessor: PerceptionProcessor = async ({ perception, workingMemory, currentProcess }) => {
  const { log } = useActions()
  const userName = useSoulMemory("userName", "Bootoshi") //Replace with your own name
  const newUserAction = useSoulMemory<string>("newUserAction", "..."); 
  const name = userName.current ? userName.current : perception.name
 
  if (perception.action === "said"){
  let content = `${name} ${perception.action}: ${perception.content}`

  newUserAction.current = content
  }
 
  return [workingMemory, currentProcess]
}
 
export default perceptionProcessor