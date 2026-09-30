import type { Metadata } from "next";
import { Source_Serif_4, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif-4",
  subsets: ["latin"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Echomind",
  description:
    "A cognitive memory test modeled on the CERAD Word List Memory Test. Demo only — not a diagnostic tool.",
  icons: {
    icon: "/echomind_icon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sourceSerif4.variable} ${ibmPlexSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-ink font-sans">
        {children}
      </body>
    </html>
  );
}
