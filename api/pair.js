const RENDER_URL = "https://tanda-mini-bot.onrender.com";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const phone = String(body.phone || "").replace(/\D/g, "");

  if (!/^254\d{9}$/.test(phone)) {
    return res.status(400).json({
      success: false,
      error: "Enter a valid Kenyan WhatsApp number using 254 followed by nine digits."
    });
  }

  try {
    const response = await fetch(`${RENDER_URL}/api/pair`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ phone }),
      signal: AbortSignal.timeout(30000)
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: false, error: text.slice(0, 500) || "Render returned a non-JSON response." };
    }

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(502).json({
      success: false,
      error: "The Vercel proxy could not reach the Render pairing endpoint.",
      details: error.message
    });
  }
};
