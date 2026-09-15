# Design tooling

Installed for the `ideation` branch (2026-09-15).

## Cursor / agent

| Tool | How |
|------|-----|
| **Impeccable** | `npx impeccable install` → `.cursor/skills/impeccable`, agents, hooks. Use `/impeccable …` in chat. |
| **shadcn skill** | `.agents/skills/shadcn` (+ migrate-radix-to-base). |
| **shadcn MCP** | `.cursor/mcp.json` — enable the `shadcn` server in Cursor Settings → MCP. |

Marketplace plugin prompt for **shadcn/ui** may still need a manual Accept in Cursor if shown.

## npm packages

| Package | Use |
|---------|-----|
| `framer-motion` | Motion / presence |
| `lucide-react` | Icons (shadcn icon library) |
| `@xyflow/react` | React Flow graphs / network diagrams |
| `shadcn` + `radix-ui` + UI under `src/components/ui` | Component system |
| `clsx` / `tailwind-merge` / `class-variance-authority` | `cn()` + variants |
| `sonner` | Toasts |
| `@dnd-kit/*` | Drag-and-drop (schedule rows, etc.) |
| `react-router-dom` | App routing |
| `zustand` | Light client state |
| `date-fns` | Dates for Gantt / calendars |
| `tw-animate-css` | shadcn animation utilities |

## Project wiring

- Alias `@/*` → `src/*` (`jsconfig.json`, `vite.config.js`)
- Theme tokens in `src/index.css` aligned to [`DESIGN.md`](../DESIGN.md) (orange accent, `radius: 0`, Work Sans / DM Serif Display)
- Add more components: `npx shadcn@latest add <name>`

## React Flow

```js
import { ReactFlow, Background, Controls } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
```
