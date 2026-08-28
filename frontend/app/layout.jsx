import { Montserrat, Outfit } from "next/font/google";
import "./globals.css";

// Heading font — used for the logo wordmark, nav bar, big headline, buttons
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-montserrat",
});

// Body font — used for paragraphs / description text
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-outfit",
});

export const metadata = {
  title: "SURKH — Pakistan's Blood, Found Fast",
  description:
    "SURKH achieves a centralised blood distribution system by connecting hospitals, patients and donors in real-time.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
