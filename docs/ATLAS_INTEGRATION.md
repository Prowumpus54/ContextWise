# BuildWise Atlas inside ContextWise

ContextWise includes the recovered **BuildWise System Atlas** visualizer as a
read-only 3D architecture page at `/atlas/` and an embedded, sandboxed panel
in the main ContextWise dashboard. Source was recovered from the authorized
local worktree `C:\BuildWiseWorktrees\buildwise-system-atlas\public\index.html`.

## Current scope

- 3D topology, orbit and WASD navigation, node inspection, and system diagrams.
- The duplicate trailing script/HTML fragment in the recovered viewer was removed.
- The iframe has `sandbox="allow-scripts allow-downloads"` and no
  `allow-same-origin`, which isolates its JavaScript from the parent app,
  Google sign-in, browser storage, and private ContextWise data.
- Three.js and OrbitControls are pinned to 0.169.0 through jsDelivr. The
  viewer requires network access for the rendering dependencies and WebGL.
- **No verified live BuildWise telemetry** is bundled or presented by default.
  All write/action controls inside Atlas remain disabled.

## Telemetry boundary

The historic local Atlas bridge used `127.0.0.1:7335/atlas/snapshot`.
The embedded view does **not** probe that address; neither does the hosted
public viewer. The standalone viewer only attempts that read-only endpoint
when explicitly opened with `?telemetry=local` from a localhost origin.
This does not automatically make the bridge work: it must be running,
authorized, and correctly configured for browser CORS. Do not expose ports
7331 or 7335 to the internet, or embed BuildWise credentials in this website.

A future authenticated, outbound-only telemetry relay may supply sanitized
information to owner-authorized sessions. Implement and review access
controls before replacing the current static preview.

## Test locally

From this repository on Windows with Node.js 20+:

```powershell
npm run verify
$env:PORT = "4186"
npm run dev
# visit http://127.0.0.1:4186 and select Atlas 3D
# or http://127.0.0.1:4186/atlas/
```

## Production considerations

Firebase Hosting serves `web/atlas/index.html`. A future Windows-hosted
production setup must offer HTTPS and authenticated access separately;
the current development server is **not** a production server. Domain
registration and routing are out of scope for this integration.

Atlas remains a viewer in ContextWise, not a replacement for BuildWise
or VaultWise authority.
