/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        "neu-out":
          "8px 8px 16px var(--neu-shadow), -6px -6px 14px var(--neu-highlight)",
        "neu-out-sm":
          "5px 5px 10px var(--neu-shadow), -4px -4px 8px var(--neu-highlight)",
        "neu-out-lg":
          "14px 14px 28px var(--neu-shadow), -10px -10px 22px var(--neu-highlight)",
        "neu-in":
          "inset 6px 6px 12px var(--neu-shadow), inset -5px -5px 10px var(--neu-highlight)",
        "neu-press":
          "inset 4px 4px 8px var(--neu-shadow), inset -3px -3px 6px var(--neu-highlight)",
        "neu-flat":
          "2px 2px 4px var(--neu-shadow), -2px -2px 4px var(--neu-highlight)",
      },
      colors: {
        clay: "var(--background)",
      },
      borderRadius: {
        neu: "1.15rem",
      },
    },
  },
}
