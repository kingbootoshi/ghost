import { Soul } from "@opensouls/engine";
import { config } from "dotenv";
import { Context, Telegraf } from "telegraf";
import { message } from "telegraf/filters";

const username = process.env.USER_NAME
const souls: Record<string, Soul> = {};

async function setupTelegramSoulBridge(telegram: Telegraf<Context>, telegramChatId: number) {

    //add functionality for unique telegram chatID souls for scaling in users. also add whitelist functionality so only permitted users can use ghost
    if (souls[telegramChatId]) {
      return souls[telegramChatId];
    }
   
    const soul = new Soul({
      organization: process.env.OPEN_SOULS_ORGANIZATION!,
      blueprint: process.env.SOUL_ENGINE_BLUEPRINT!,
      token: process.env.SOUL_ENGINE_API_KEY,
      soulId: process.env.SOUL_ID,
      debug: true,
    });
   
    soul.on("says", async (event) => {
      const content = await event.content();
      await telegram.telegram.sendMessage(Number(telegramChatId), content);
    });
   
    await soul.connect();
   
    souls[telegramChatId] = soul;
   
    return soul;
  }
 
async function connectToTelegram() {
  const telegraf = new Telegraf<Context>(process.env.TELEGRAM_TOKEN!);
  telegraf.launch();
 
  process.once("SIGINT", () => telegraf.stop("SIGINT"));
  process.once("SIGTERM", () => telegraf.stop("SIGTERM"));

  console.log("Telegram connected!")
 
  return telegraf;
}
 
async function connectToSoulEngine(telegram: Telegraf<Context>) {
    const authorizedUserId: number = Number(process.env.TELEGRAM_USER_ID);
  
    telegram.on(message("text"), async (ctx) => {
    const telegramChatId = ctx.message.chat.id;
    const soul = await setupTelegramSoulBridge(telegram, ctx.message.chat.id);
      if (ctx.from?.id === authorizedUserId) {
  
        soul.dispatch({
          action: "said",
          content: ctx.message.text,
        });
  
        await ctx.telegram.sendChatAction(telegramChatId, "typing");
      } else {
        await ctx.reply(`You're not ${username}! Ignoring.`);
      }
    });
  }
 
async function run() {
  config();
  const telegram = await connectToTelegram();
  connectToSoulEngine(telegram);
}
 
run();