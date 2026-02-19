import type { Metadata, Viewport } from "next";
import Providers from "@/components/Providers";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "CLASH OF WOLVES | The Arena",
  description: "Real-time crypto prediction arena",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Providers>
          {/* Fog layers — exact match from clashofwolves.xyz */}
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <div
              className="fog-layer absolute w-[200%] h-full opacity-60 animate-fog-1"
              style={{
                top: "20%",
                background: "radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0, transparent 70%)",
              }}
            />
            <div
              className="fog-layer absolute w-[200%] h-full opacity-30 animate-fog-2"
              style={{
                top: "50%",
                background: "radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0, transparent 70%)",
              }}
            />
          </div>
          <div className="relative z-10 pb-20">{children}</div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
