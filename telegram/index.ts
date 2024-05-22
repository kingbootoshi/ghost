import { Soul } from "@opensouls/engine";
import { config } from "dotenv";
import { Context, Telegraf } from "telegraf";
import { message } from "telegraf/filters";

const souls: Record<string, Soul> = {};
const lastMessageTimestamps: Record<number, number> = {};

async function connectToTelegram() {
  const telegraf = new Telegraf<Context>(process.env.TELEGRAM_TOKEN!);
  telegraf.launch();

  const { username } = await telegraf.telegram.getMe();
  console.log(`Start chatting here: https://t.me/${username}`);

  process.once("SIGINT", () => telegraf.stop("SIGINT"));
  process.once("SIGTERM", () => telegraf.stop("SIGTERM"));

  return telegraf;
}

async function setupTelegramSoulBridge(telegram: Telegraf<Context>, telegramChatId: number) {
  if (souls[telegramChatId]) {
    return souls[telegramChatId];
  }

  const soul = new Soul({
    soulId: `BOO-${String(telegramChatId)}`,
    organization: process.env.OPEN_SOULS_ORGANIZATION!,
    blueprint: process.env.SOUL_ENGINE_BLUEPRINT!,
  });

  console.log(`Connected to ${String(telegramChatId)}`)

  soul.on("says", async (event) => {
    let content = await event.content();
    if (content.length > 4096) {
      content = content.substring(0, 4093) + '...';
    }
    await telegram.telegram.sendMessage(Number(telegramChatId), content);
  });

  await soul.connect();

  souls[telegramChatId] = soul;

  return soul;
}

async function connectToSoulEngine(telegram: Telegraf<Context>) {
  const authorizedUserIds: number[] = [1037589495];

  for (const userId of authorizedUserIds) {
    const telegramChatId = userId;
    await setupTelegramSoulBridge(telegram, telegramChatId);
  }

  telegram.on(message("text"), async (ctx) => {
    const telegramChatId = ctx.message.chat.id;
    const currentTimestamp = Date.now();

    lastMessageTimestamps[telegramChatId] = currentTimestamp;

    const soul = await setupTelegramSoulBridge(telegram, telegramChatId);

    if (authorizedUserIds.includes(ctx.from?.id)) {
      const messageText = ctx.message.text;

      soul.dispatch({
        action: "said",
        content: messageText,
      });

      await ctx.telegram.sendChatAction(telegramChatId, "typing");
    } else {
      await ctx.reply(`You're not authorized! Ignoring.`);
    }
  });
}

async function run() {
  config();
  const telegram = await connectToTelegram();
  connectToSoulEngine(telegram);
}

run();