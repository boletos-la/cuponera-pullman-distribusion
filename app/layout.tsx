import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cuponera Pullman Bus | Beneficios y Descuentos",
  description: "Portal oficial de Cuponeras Pullman Bus. Accede a descuentos exclusivos.",
};

export const viewport: Viewport = {
  themeColor: "#0739b3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
