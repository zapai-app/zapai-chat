# ZapAI Chat

ZapAI is an AI bot that operates on the Nostr network. Unlike traditional AI services, ZapAI only responds when you send a Lightning payment (zap) in exchange for answers.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   
3. **Set target user in `.env`:**
   ```env
   VITE_TARGET_PUBKEY=npub1...
   ```

4. **Run:**
   ```bash
   npm run dev
   ```

5. **Open:** http://localhost:8080

## Build for Production

```bash
npm run build
```

