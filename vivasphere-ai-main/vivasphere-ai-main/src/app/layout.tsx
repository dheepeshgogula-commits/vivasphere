import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VivaSphere AI — Technical Viva Voce & Interview Simulator",
  description: "AI-Powered Technical Viva & Interview Simulator with real-time proctoring, anti-cheat security, adaptive difficulty scaling, and comprehensive feedback reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Anti-flash theme loader */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('vivasphere_theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}` }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}
