import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Fragment_Mono, Inter_Tight } from "next/font/google";
import Footer from "@/components/Footer";
import ScrollTop from "@/components/ScrollTop";
import { DataProvider } from "./providers";
import "./globals.css";

// next/font self-hosts these at build time: no CDN at runtime, so the PWA
// still has its typography offline.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = Fragment_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "conju.gat — conjugacions catalanes",
  description:
    "Les conjugacions catalanes amb un senyal per a cada mecanisme. Més de 8.500 verbs, present d'indicatiu.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "conju.gat", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icon-180.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfbf7" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ca"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        <ScrollTop />
        <DataProvider>{children}</DataProvider>
        <Footer />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker'in navigator){addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </body>
    </html>
  );
}
