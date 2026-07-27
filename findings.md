# Findings & Decisions

## Requirements
- Resolve `listen EADDRINUSE: address already in use 0.0.0.0:3000` error when launching backend development server.

## Research Findings
- The application crashes when trying to start because port 3000 is occupied.
- Checked port 3000 usage and found process PID `15901` running `/usr/bin/node-22 src/index.js` (an existing backend server instance) is listening on port 3000.
- Searched codebase and verified that the mobile application is configured to connect to port 3000 (`mobile/lib/api.ts` line 5: `return \`http://\${ip}:3000/api\`;`).

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Terminate the background server instance on port 3000 | Freeing the port allows the development server to run on the expected port 3000 without requiring configuration updates in the mobile app. |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
|       |            |

## Resources
- Backend directory: [backend](file:///home/night/Documentos/appimpressoras/backend)
- Entrypoint: [backend/src/index.js](file:///home/night/Documentos/appimpressoras/backend/src/index.js)

## Visual/Browser Findings
- None yet.

---
*Update this file after every 2 view/browser/search operations*
*This prevents visual information from being lost*
