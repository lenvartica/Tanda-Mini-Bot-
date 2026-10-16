const RENDER_URL = "https://tanda-mini-bot.onrender.com";

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(`${RENDER_URL}/api/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12000)
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text.slice(0, 500) };
    }

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(502).json({
      error: "Could not reach the Render health endpoint.",
      details: error.message
    });
  }
};
