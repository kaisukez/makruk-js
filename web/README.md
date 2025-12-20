# Makruk Web

A showcase web app for the makruk-js library.

## Features

- **Play vs Bot** - Adjustable AI difficulty (depth 1-5)
- **Local Play** - Two players on the same device
- **Online Play** - Peer-to-peer via WebRTC with manual code sharing

## Development

```bash
# From root directory
pnpm web:dev     # Start dev server
pnpm web:build   # Build for production
pnpm web:preview # Preview production build

# Or from web directory
cd web
pnpm dev
pnpm build
pnpm preview
```

## How Online Play Works

### User Flow

1. **Host** clicks "Create Game" and gets an offer code
2. **Host** shares the code with opponent (via chat, email, etc.)
3. **Guest** clicks "Join Game" and pastes the offer code
4. **Guest** gets an answer code and shares it with host
5. **Host** pastes the answer code
6. Connection established, game starts!

No server required - uses WebRTC for direct peer-to-peer connection.

### WebRTC Technical Details

Traditional WebRTC requires a signaling server to exchange connection metadata between peers. This implementation uses **manual signaling** - the connection codes are exchanged by the users themselves.

#### What's in the codes?

Each code is a base64-encoded JSON containing:
- **SDP (Session Description Protocol)** - Describes the session: codecs, transport protocols, and connection parameters
- **ICE Candidates** - Network addresses (IP:port pairs) where the peer can be reached

#### Signaling Flow

```
Host                                    Guest
────                                    ─────
1. Create RTCPeerConnection
2. Create RTCDataChannel
3. Create SDP Offer
4. Gather ICE candidates (wait ~2s)
5. Encode offer + candidates → OFFER CODE
                 ──────────────────────────►
                                        6. Paste OFFER CODE
                                        7. Create RTCPeerConnection
                                        8. Set remote description (offer)
                                        9. Create SDP Answer
                                        10. Gather ICE candidates
                                        11. Encode answer + candidates → ANSWER CODE
                 ◄──────────────────────────
12. Paste ANSWER CODE
13. Set remote description (answer)
                 ════════ CONNECTED ════════
```

#### Why manual signaling?

- **No server costs** - No signaling server to deploy or maintain
- **True serverless** - Works as a static site on GitHub Pages
- **Privacy** - Connection metadata never touches a third-party server
- **Simplicity** - No WebSocket infrastructure needed

#### Message Protocol

Once connected, peers exchange JSON messages over the DataChannel:

```typescript
type WebRTCMessage =
  | { type: 'MOVE'; move: MoveObject; fen: string }
  | { type: 'SYNC'; fen: string }
  | { type: 'NEW_GAME' }
  | { type: 'RESIGN' }
```

## Tech Stack

- React + TypeScript
- Vite
- TailwindCSS
- WebRTC (native browser API)
