import type { Metadata } from "next";
import { Bowlby_One_SC, Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

/* Bowlby One SC is a stamped, embossed display face — a toy logo rather than a
   SaaS heading. Nunito's rounded terminals match moulded plastic. */
const bowlby = Bowlby_One_SC({
  variable: "--font-bowlby",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Roster Royale",
  description:
    "Draft four names from a pool of eight with every rating hidden, then flip them over and find out who won. Play the House on your own, or pass one phone round with a friend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bowlby.variable} ${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="px-5 pb-7 pt-10 text-center text-[11px] leading-relaxed text-plate/35">
          For entertainment purposes only. Ratings reflect the platform&rsquo;s own opinion, not the
          individuals named, who are not affiliated with or endorsing this product.
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
