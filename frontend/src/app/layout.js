import "./globals.css";
import Navbar from "@/components/ui/navbar";

export const metadata = {
  title: "Learnix",
  description: "AI-powered study platform for engineering students",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
