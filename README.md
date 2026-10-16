# Tanda Mini Bot Vercel frontend

This project uses Vercel for the static website and serverless API proxy, and your existing Render deployment for WhatsApp pairing.

## Files

- `index.html` — user interface
- `styles.css` — responsive glassmorphism styling and background image reference
- `app.js` — pairing form, status display, command-copy buttons
- `api/pair.js` — securely proxies pairing requests to Render `/api/pair`
- `api/health.js` — proxies status checks to Render `/api/health`
- `vercel.json` — security headers and static site configuration

## Jin-Woo background

Put your image in the project root and name it exactly `jinwoo.png`. The CSS already uses `./jinwoo.png`. Use an image you have permission to use.

## Deploy

1. Extract this ZIP.
2. Add `jinwoo.png` to the project root.
3. Push the contents to your GitHub repository.
4. Import the repository into Vercel.
5. Select Framework Preset `Other`.
6. Leave Build Command empty and set Output Directory to `.`.
7. Deploy.

## Existing Render API contract

This frontend is wired to the API contract from your existing Tanda Mini Bot:
- `POST https://tanda-mini-bot.onrender.com/api/pair` with JSON `{ "phone": "2547XXXXXXXXX" }`
- `GET https://tanda-mini-bot.onrender.com/api/health`

The Vercel proxy avoids browser-to-Render CORS restrictions. It does not make the pairing service publicly available without limits; consider adding rate limiting or authorization to the Render pairing endpoint to prevent abuse.

Do not place Supabase service-role keys or WhatsApp session credentials in frontend code.
