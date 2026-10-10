import type { SkillGroup } from "./types";

/**
 * Skills, grouped the way I think about the work. Every tool listed is used in
 * at least one public project; `proof` lists those project slugs and the UI
 * resolves them against projects.ts, so the evidence is real work, never a bar.
 */
export const skillGroups: SkillGroup[] = [
  {
    id: "frontend",
    label: "Frontend",
    statement: "Interfaces that hold up in two languages, two directions and very long lists.",
    tools: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Zustand"],
    proof: ["namaa", "snapvault", "windows", "tahadi", "buildx"],
  },
  {
    id: "backend",
    label: "Backend",
    statement: "Servers and services that own the state and treat the client as untrusted.",
    tools: ["Node.js", "Socket.IO", "Prisma", "discord.js", "C# / .NET"],
    proof: ["tahadi", "remotex", "buildx", "sonaris", "voice-commander"],
  },
  {
    id: "desktop",
    label: "Desktop Applications",
    statement: "Windows applications with a Rust core and a web interface, shipped offline-first.",
    tools: ["Rust", "Tauri 2", "Electron", "WebView2", "Windows services"],
    proof: ["veilock", "remotex", "rimlight", "snapvault", "folderforge", "namaa", "stockflow"],
  },
  {
    id: "databases",
    label: "Databases",
    statement: "Local-first storage and search chosen for the job rather than the trend.",
    tools: ["SQLite", "FTS5", "better-sqlite3", "Prisma"],
    proof: ["snapvault", "namaa", "stockflow", "buildx"],
  },
  {
    id: "uiux",
    label: "UI/UX Engineering",
    statement: "Window managers, canvas interactions and scroll-driven pages, with real right-to-left layouts.",
    tools: ["GSAP", "ScrollTrigger", "Canvas", "RTL layouts"],
    proof: ["windows", "ram-power", "veilock", "namaa"],
  },
  {
    id: "tools",
    label: "Development Tools",
    statement: "Build pipelines, packaging and the small scripts that keep a project reproducible.",
    tools: ["Git & GitHub", "Vite", "Cargo", "Vercel", "Docker"],
    proof: ["remotex", "folderforge", "sonaris"],
  },
];
