/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Warna Background
    {
      pattern:
        /bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|transparent)-(50|100|200|300|400|500|600|700|800|900|950)/,
    },
    // Warna Text
    {
      pattern:
        /text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|transparent)-(50|100|200|300|400|500|600|700|800|900|950)/,
    },
    // Warna Border
    {
      pattern:
        /border-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|transparent)-(50|100|200|300|400|500|600|700|800|900|950)/,
    },
    // Spacing - Padding & Margin
    {
      pattern:
        /(p|m)(t|r|b|l|x|y)?-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)/,
    },
    // Spacing - Space Between
    {
      pattern:
        /space-(x|y)-(1|2|3|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)/,
    },
    // Sizing - Width & Height
    {
      pattern:
        /(w|h)-(auto|full|screen|1\/2|1\/3|2\/3|1\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|5\/6|0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)/,
    },
    // Typography - Font Size
    {
      pattern: /text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/,
    },
    // Typography - Font Weight
    {
      pattern:
        /font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/,
    },
    // Typography - Line Height
    {
      pattern:
        /leading-(none|tight|snug|normal|relaxed|loose|3|4|5|6|7|8|9|10)/,
    },
    // Border Radius
    {
      pattern: /rounded(-(none|sm|md|lg|xl|2xl|3xl|full))?/,
    },
    // Border Width
    {
      pattern: /border(-(0|2|4|8))?/,
    },
    // Shadow
    {
      pattern: /shadow(-(none|sm|md|lg|xl|2xl|inner))?/,
    },
    // Opacity
    {
      pattern: /opacity-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100)/,
    },
    // Display
    "block",
    "inline-block",
    "inline",
    "flex",
    "inline-flex",
    "grid",
    "inline-grid",
    "hidden",
    "table",
    // Flexbox
    "flex-row",
    "flex-row-reverse",
    "flex-col",
    "flex-col-reverse",
    "flex-wrap",
    "flex-wrap-reverse",
    "flex-nowrap",
    "justify-start",
    "justify-end",
    "justify-center",
    "justify-between",
    "justify-around",
    "justify-evenly",
    "items-start",
    "items-end",
    "items-center",
    "items-baseline",
    "items-stretch",
    "content-start",
    "content-end",
    "content-center",
    "content-between",
    "content-around",
    "content-evenly",
    "self-auto",
    "self-start",
    "self-end",
    "self-center",
    "self-stretch",
    "self-baseline",
    "flex-1",
    "flex-auto",
    "flex-initial",
    "flex-none",
    "grow",
    "grow-0",
    "shrink",
    "shrink-0",
    // Grid
    "grid-cols-1",
    "grid-cols-2",
    "grid-cols-3",
    "grid-cols-4",
    "grid-cols-5",
    "grid-cols-6",
    "grid-cols-7",
    "grid-cols-8",
    "grid-cols-9",
    "grid-cols-10",
    "grid-cols-11",
    "grid-cols-12",
    "col-auto",
    "col-span-1",
    "col-span-2",
    "col-span-3",
    "col-span-4",
    "col-span-5",
    "col-span-6",
    "col-span-7",
    "col-span-8",
    "col-span-9",
    "col-span-10",
    "col-span-11",
    "col-span-12",
    "col-span-full",
    // Position
    "static",
    "fixed",
    "absolute",
    "relative",
    "sticky",
    // Top Right Bottom Left
    {
      pattern:
        /(inset-|top-|bottom-|left-|right-)(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|full)/,
    },
    // Z-Index
    {
      pattern: /z-(0|10|20|30|40|50|auto|base)/,
    },
    // Cursor
    "auto",
    "default",
    "pointer",
    "wait",
    "text",
    "move",
    "help",
    "not-allowed",
    // Text Align
    "text-left",
    "text-center",
    "text-right",
    "text-justify",
    "text-start",
    "text-end",
    // Text Transform
    "uppercase",
    "lowercase",
    "capitalize",
    "normal-case",
    // Object Fit
    "object-contain",
    "object-cover",
    "object-fill",
    "object-none",
    "object-scale-down",
    // Overflow
    "overflow-auto",
    "overflow-hidden",
    "overflow-visible",
    "overflow-scroll",
    "overflow-x-auto",
    "overflow-y-auto",
    "overflow-x-hidden",
    "overflow-y-hidden",
    "overflow-x-scroll",
    "overflow-y-scroll",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4559F2",
        secondary: "#fcd34d",
        success: require("tailwindcss/colors").green,
        warning: require("tailwindcss/colors").yellow,
        error: require("tailwindcss/colors").red,
        "blue-light": require("tailwindcss/colors").blue,
      },
      animation: {
        "spin-slow": "spin 3s linear infinite",
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
