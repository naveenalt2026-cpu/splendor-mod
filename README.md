# 👑 Splendor — Renaissance Tabletop Board Game

A web implementation of the board game **Splendor**, crafted with modern web technologies. Supports both cross-device party play (large shared screen + personal smartphone controllers) and a standalone single-device Solo Mode against computer AI opponents.

---

## ✨ Features

### 📺 Cross-Device Multiplayer (Party Tabletop Mode)
- **Shared Host Display**: Run on a TV, tablet, or laptop monitor as the central shared board for all players.
- **QR Code Instant Join**: Scan the large QR code with any smartphone camera to instantly enter the lobby with zero app installation or account sign-ups.
- **Personal Mobile Controller**:
  - Handheld interface for private cards, reserved cards, and gem collection.
  - Screen WakeLock integration (`useWakeLock`) to prevent mobile phones from dimming or locking during gameplay.
  - Automatic reconnection handling: If a phone screen locks or browser sleeps, unlocking automatically reconnects to the existing session without losing game state or reserved cards.
- **Turn Action Pop-ups**: Dynamic visual notifications showing the exact physical card, gem chips, or noble tile collected on each move.

### 🤖 Solo Practice vs AI (Single Device)
- Play locally on one screen against computer opponents with selectable AI difficulty (Easy, Medium, Hard).
- Interactive header **Gem Bank Pill** with staged token collection and validation.
- Clickable reserved cards drawer (`📂 Reserved (X/3)`) with instant purchase triggers.
- Support for on-deck blind tier card reservations (+1 Gold joker).
- 10-token discard limit enforcement modal.
- Celebratory Renaissance noble patron fanfare animations.

### 💎 Tabletop Visual Polish & Design
- **Unified Buying Power Display**: Combines tokens and card discounts into a single glanceable badge (faceted gem icon in center, `+{bonus}` discount count on top-right, total buying power underneath).
- **High-Contrast Board Surfaces**: Sunken obsidian presentation tray for Nobles, elevated Renaissance card gradients, and crisp faceted gem icons.
- **Custom Renaissance Portraits**: Detailed SVG portraits for historical nobles (Catherine de' Medici, Francis I, Charles V, Suleiman the Magnificent, Mary Stuart, Anne of Brittany, and more).
- **Atmospheric Audio**: Tactile sound effects for token clicks, card purchases, turn changes, and victory chimes.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Vite 8](https://vitejs.dev/)
- **Icons & Motion**: [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)
- **Backend**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [ws (WebSockets)](https://github.com/websockets/ws)
- **QR Code Engine**: `qrcode.react`
- **Testing**: Node.js Native Test Runner (`node:test`, `node:assert`) with `tsx`

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: `v20.18+` (or `v22+` recommended)
- **npm**: `v10+`

### Installation
```bash
git clone https://github.com/naveenalt2026-cpu/splendor-mod.git
cd "splendor game"
npm install
```

### Running Locally
To launch both the HTTP web server and WebSocket multiplayer backend:
```bash
npm start
```
By default, the server will be accessible at:
- **Local**: `http://localhost:3000`
- **LAN (Mobile Devices)**: `http://<your-lan-ip>:3000` (printed in terminal console on startup)

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```
Production assets are generated into the `dist/` directory and served automatically by `server.ts`.

---

## 🧪 Testing

Run backend session management and rules engine test suites:
```bash
npx tsx --test src/server/sessionManager.test.ts
```

Run TypeScript type verification:
```bash
npm run lint
```

---

## 📁 Project Structure

```
├── server.ts                   # Express & WebSocket server with LAN IP detection
├── src/
│   ├── App.tsx                 # Master view router (Host / Player / Solo)
│   ├── components/
│   │   ├── HostLobbyView.tsx   # Host room creation with large QR code
│   │   ├── HostTableView.tsx   # Central shared board (TV / Tablet layout)
│   │   ├── SoloTableView.tsx   # Standalone single-device Solo vs AI board
│   │   ├── MobilePlayerView.tsx# Handheld smartphone controller
│   │   ├── MobileJoinScreen.tsx# Room code entry / name selection
│   │   ├── DevelopmentCardView.tsx # Face-up development card component
│   │   ├── NobleTileView.tsx   # Noble patron tile with requirement chips
│   │   ├── NoblePortrait.tsx   # Custom historical SVG noble illustrations
│   │   ├── GemIcon.tsx         # Faceted gems and gold chip renderings
│   │   ├── TurnActionNotification.tsx # Animated turn action pop-ups
│   │   └── DiscardTokensModal.tsx  # 10-token rule enforcement modal
│   ├── game/
│   │   ├── rules.ts            # Authoritative Splendor rules engine
│   │   ├── ai.ts               # Heuristic AI logic (Easy / Medium / Hard)
│   │   ├── cards.ts            # Development cards and noble tile datasets
│   │   ├── constants.ts        # Gem colors, tokens, and visual palettes
│   │   └── sound.ts            # Web Audio API sound synthesizer
│   ├── server/
│   │   ├── sessionManager.ts   # In-memory room & session state manager
│   │   └── sessionManager.test.ts # Unit tests for multiplayer rooms & reconnection
│   ├── hooks/
│   │   ├── useMultiplayerSocket.ts # WebSocket client hook with auto-reconnect
│   │   └── useWakeLock.ts      # Screen Wake Lock API for mobile devices
│   └── types/
│       ├── game.ts             # Core game state & card data types
│       └── multiplayer.ts      # WebSocket network message protocol
```

---

## 📜 Splendor Game Rules Summary

1. **Take Tokens**: Take 3 tokens of different colors, or 2 tokens of the same color (if at least 4 remain in the bank). Total token limit is 10.
2. **Buy a Card**: Pay the required gem cost minus your permanent card discounts to acquire development cards.
3. **Reserve a Card**: Reserve 1 face-up card or 1 blind top card from any Tier deck (maximum 3 reserved cards). Receive 1 Gold joker token if available.
4. **Noble Visit**: If you accumulate the required permanent card bonuses for an available Noble patron, they visit you automatically, granting +3 Prestige Points.
5. **Winning the Game**: The first player to reach 15 Prestige Points triggers the final round. The player with the highest score at the end of the round is declared the Renaissance Master!

---

## 📄 License
This project is for educational and personal use.
