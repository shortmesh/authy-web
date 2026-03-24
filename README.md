# authy-web

[Authy by ShortMesh](https://github.com/shortmesh/Authy-API) — an open-source, self-hostable OTP (one-time password) service that delivers verification codes over WhatsApp, Telegram, and Signal.

Built with **React 19 + Vite 8**.

---

## What this site does

- **Live demo** — lets any visitor enter their phone number, pick a messaging platform, receive a real OTP, and verify it against the ShortMesh hosted Authy API.

---


## How the demo was implemented

### 1. Widget script loading (`useWidgetScript`)

The ShortMesh widget (`widget.js`) is a plain JS drop-in served directly from the Authy API server. Instead of a static `<script>` tag in `index.html`, we load it dynamically at runtime so the latest version is always fetched:

```js
const s = document.createElement("script");
s.src = import.meta.env.DEV
  ? "/widget.js"           // Vite proxy → beta.shortmesh.com in dev
  : "https://beta.shortmesh.com/widget.js";
document.body.appendChild(s);
```

### 2. Dev-server proxy (`vite.config.js`)

The widget script and its bundled SVG icons are served from `beta.shortmesh.com` with a `Cross-Origin-Resource-Policy` header that blocks direct `<script src>` fetches from a different origin. During local development, Vite transparently proxies these paths:

| Path | Proxied to |
|---|---|
| `/widget.js` | `https://beta.shortmesh.com/widget.js` |
| `/WhatsApp.svg` | `https://beta.shortmesh.com/WhatsApp.svg` |
| `/Signal-Logo.svg` | `https://beta.shortmesh.com/Signal-Logo.svg` |
| `/Logo.svg` | `https://beta.shortmesh.com/Logo.svg` |


### 3. Phone input (`react-international-phone`)

`react-international-phone` provides the country-flag selector and E.164 phone number formatting. The component enforces a valid `+<country><number>` pattern before the OTP flow can proceed.

### 4. Platform picker (`ShortMeshWidget`)

When the user submits their phone number, we first fetch the `/platforms` endpoint to get a list of registered sender devices and cache them in a `ref`:

```js
const res = await fetch(`${API_BASE}/platforms`);
platformsRef.current = await res.json(); // [{ platform: "wa", device_id: "..." }, ...]
```

We then open the widget modal:

```js
window.ShortMeshWidget.open({
  endpoints: { platforms: `${API_BASE}/platforms` },
  onSelect: (chosenPlatform) => {
    const match = platformsRef.current.find(p => p.platform === chosenPlatform);
    sendOTP(chosenPlatform, match?.device_id);
  },
});
```

The widget renders the platform picker UI; on selection the `onSelect` callback fires and we immediately call the generate endpoint.

### 5. OTP flow (generate → verify)

The demo card cycles through four stages managed with a single `stage` state variable:

| Stage | What is shown |
|---|---|
| `idle` | Phone input form |
| `sending` | Loading state while `POST /otp/generate` is in flight |
| `verify` | 6-box OTP input |
| `success` | Confirmation message |

**Generate:**
```
POST {API_BASE}/otp/generate
{ device_id, phone_number, platform }
```

**Verify:**
```
POST {API_BASE}/otp/verify
{ code, device_id, phone_number, platform }
```

`API_BASE` is injected at build time via the `VITE_API_BASE_URL` environment variable.

### 6. OTP input (`OTPInputs`)

A custom 6-box OTP input that:
- Auto-advances focus to the next box on digit entry
- Steps back on `Backspace`
- Handles paste of a full 6-digit code
- Uses `autocomplete="one-time-code"` on the first box for mobile autofill

### 7. Syntax highlighting

Code snippets in the "How it works" section are highlighted without any external library. A small `highlight(raw, lang)` function uses regex substitutions to wrap tokens in `<span class="hl-*">` elements. `dangerouslySetInnerHTML` is safe here because every snippet is a **hardcoded constant** in the source — no user input is ever passed through the highlighter.

---

## Environment variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of your Authy API instance |

Create a `.env.local` file for local development:

```
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## Running locally

```bash
# Install dependencies
yarn install

# Start the dev server (proxy to beta.shortmesh.com is active automatically)
yarn dev

# Production build
yarn build
```

---

## Related repositories

| Repo | Description | Language |
|---|---|---|
| [Authy-API](https://github.com/shortmesh/Authy-API) | OTP generation, delivery & verification service | Go |
| [Interface-API](https://github.com/shortmesh/Interface-API) | Primary interface service built on Matrix | Go |
| [Widgets](https://github.com/shortmesh/Widgets) | Drop-in platform-picker widget for web | JS |
| [Widget-android](https://github.com/shortmesh/Widget-android) | Native Android SDK for platform selection | Android |
