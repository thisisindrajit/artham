import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

// Plex Mono has no variable axis, so the weights are requested explicitly.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Artham — solve the story, see how you think",
  description:
    "Artham means reason. Step into a situation, work it out, and see your reasoning read back to you as a Thinking Profile.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${plexMono.variable} h-full antialiased`}>
      <head>
        {/* Satoshi is only on Fontshare, so it can't go through
            next/font/google. The odd weights are the true italics — the UI
            leans on italic a lot, so they are worth the bytes. */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,301,400,401,500,501,700,701&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
