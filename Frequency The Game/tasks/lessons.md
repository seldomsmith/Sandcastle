# Lessons Learned

## 2026-04-14: Initialization Failures
- **Environment Verification**: Always verify the availability of core tools (`node`, `npm`, `npx`) before committing to an implementation plan that depends on them.
- **Vision Document**: Strict adherence to "Read vision.md first" is critical. It prevented me from starting with a generic framework before knowing the exact tech stack (PixiJS/Redux).
- **Tooling Discovery**: When `type -a` fails and `/usr/local/bin` is missing, investigate `/opt/` or custom paths like `/opt/pmk/env/global/bin`.
