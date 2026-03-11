import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Speakprime",
  description: "AI-powered real-time coaching for interviews and presentations. Get coached live by Speakprime.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#111111]">
        {children}
      </body>
    </html>
  );
}
