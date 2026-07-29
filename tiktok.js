const axios = require("axios");

/**
 * Fetches TikTok video info (no watermark + best available quality)
 * using the public tikwm.com API.
 * @param {string} url - TikTok video URL
 */
async function getTikTokInfo(url) {
  const { data } = await axios.post(
    "https://www.tikwm.com/api/",
    new URLSearchParams({ url, hd: "1" }),
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 20000,
    }
  );

  if (!data || data.code !== 0 || !data.data) {
    throw new Error("Failed to fetch video. Check the link and try again.");
  }

  const d = data.data;

  return {
    title: d.title || "TikTok Video",
    author: d.author?.nickname || d.author?.unique_id || "Unknown",
    cover: d.cover,
    noWatermarkUrl: d.hdplay || d.play, // best available quality, no watermark
    watermarkUrl: d.wmplay,
    duration: d.duration,
    musicUrl: d.music,
  };
}

module.exports = { getTikTokInfo };
