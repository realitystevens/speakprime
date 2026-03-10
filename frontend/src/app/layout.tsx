import type { Metadata } from "next";
import "../styles/index.css";

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
      <body style={{ background: "#111111", fontFamily: "Inter, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
