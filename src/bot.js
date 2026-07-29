const TelegramBot = require("node-telegram-bot-api");
const { getTikTokInfo } = require("./tiktok");

const TIKTOK_URL_REGEX = /(https?:\/\/(www\.|vm\.|vt\.|m\.)?tiktok\.com\/\S+)/i;

const AD_LINKS = [process.env.AD_LINK_1, process.env.AD_LINK_2].filter(Boolean);
const AD_DELAY_SECONDS = parseInt(process.env.AD_DELAY_SECONDS || "10", 10);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createBot(token) {
  const bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
      msg.chat.id,
      "👋 Send me any TikTok video link and I'll download it for you without watermark, in the best available quality."
    );
  });

  bot.on("message", async (msg) => {
    const text = msg.text || "";
    if (text.startsWith("/start")) return;

    const match = text.match(TIKTOK_URL_REGEX);
    if (!match) {
      if (!text.startsWith("/")) {
        bot.sendMessage(msg.chat.id, "❌ Please send a valid TikTok video link.");
      }
      return;
    }

    const url = match[1];
    const chatId = msg.chat.id;

    try {
      for (let i = 0; i < AD_LINKS.length; i++) {
        await bot.sendMessage(
          chatId,
          `📢 Ad ${i + 1}/${AD_LINKS.length} — please tap the link below:\n${AD_LINKS[i]}\n\n⏳ Your video will continue in ${AD_DELAY_SECONDS} seconds...`,
          { disable_web_page_preview: true }
        );
        await sleep(AD_DELAY_SECONDS * 1000);
      }

      const loadingMsg = await bot.sendMessage(chatId, "⏳ Processing your video, please wait...");

      const info = await getTikTokInfo(url);

      if (!info.noWatermarkUrl) {
        throw new Error("No downloadable video found for this link.");
      }

      await sleep(1000);

      await bot.sendVideo(chatId, info.noWatermarkUrl, {
        caption: `🎬 ${info.title}\n👤 ${info.author}`,
      });

      bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});
    } catch (err) {
      console.error("Download error:", err.message);
      bot.sendMessage(
        chatId,
        "⚠️ Sorry, I couldn't download that video. Make sure the link is correct and the video is public."
      );
    }
  });

  bot.on("polling_error", (err) => {
    console.error("Polling error:", err.message);
  });

  return bot;
}

module.exports = { createBot };
