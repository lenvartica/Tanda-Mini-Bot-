# Tanda Mini Bot — Vercel frontend

A static HTML/CSS/JavaScript frontend designed to use the existing Render service at `https://tanda-mini-bot.onrender.com`.

## Files

- `index.html` — page structure
- `styles.css` — responsive glass UI and Jin-Woo background styling
- `app.js` — status check, command copy buttons, and pairing API integration
- `vercel.json` — static deployment configuration
- `jinwoo.png` — add your own background image using this exact filename

## Add the Jin-Woo background

Place your Sung Jin-Woo image in this project folder and name it `jinwoo.png`. The CSS already references `./jinwoo.png`. Use an image you have permission to use.

## Deploy to Vercel

1. Extract the ZIP.
2. Add `jinwoo.png` to the project folder.
3. Upload the folder to a GitHub repository, or import the repository in Vercel.
4. Choose the project root as the Root Directory.
5. Framework Preset: Other.
6. Build Command: leave empty.
7. Output Directory: `.`.
8. Deploy.

## Important API integration note

The public page is reachable, but this frontend cannot safely assume the actual pairing route or response format. `app.js` currently tries `/pair`, `/api/pair`, and `/pairing` with a POST body containing `phone`, `number`, and `phoneNumber`. Replace `PAIR_ENDPOINTS` and the request body with the exact route and schema implemented in your Render `server.js`.

For browser-side calls, the Render API must allow the deployed Vercel origin through CORS. If you do not want to expose a pairing endpoint directly to browsers, add a server-side proxy and protect sensitive actions with rate limits and authorization.

Do not expose WhatsApp session credentials, Supabase service-role keys, or private API tokens in frontend files.
