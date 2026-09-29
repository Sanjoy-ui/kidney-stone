import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

export const metadata: Metadata = {
  title: "NephroScan AI — Medical Diagnostic Center",
  description:
    "AI-powered kidney stone detection and medical diagnostic platform. Fast, validated diagnosis and structured clinical reports in under 2 seconds.",
  icons: {
    icon: "/mainLogo.png",
    shortcut: "/mainLogo.png",
    apple: "/mainLogo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/mainLogo.png" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.3.1/css/all.min.css"
          integrity="sha512-QeR2VH+lsBE5LSAe1Q5EnTBbe7XTBubt8dG93Y7gidSgdMCr8nVqKcfKAMyN96SV8KDbZVTDXChatu5G2KQGzg=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="min-h-screen bg-[#f8fafc] text-[#334155] antialiased selection:bg-[#caf0f8] selection:text-[#03045e]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
