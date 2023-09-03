import "../styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { css } from "../../styled-system/css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "expensif",
  description: "But it's free!",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={css({ height: "100%" })}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
