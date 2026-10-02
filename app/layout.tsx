import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import ToasterClient from "@/components/ToasterClient";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cuponera Pullman Bus | Beneficios y Descuentos",
  description: "Portal oficial de Cuponeras Pullman Bus. Accede a descuentos exclusivos.",
  robots: {
    index: false,
    follow: false,
  }
};

export const viewport: Viewport = {
  themeColor: "#0739b3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased" suppressHydrationWarning>
      <body suppressHydrationWarning className={`min-h-full flex flex-col antialiased ${inter.className} ${montserrat.variable}`}>
        <ToasterClient />
        {children}
      </body>
    </html>
  );
}
