import "./globals.css";
import "@radix-ui/themes/styles.css";
import "../linear.scss";
import { Providers } from "./providers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "expensif",
  description: "But it's free!",
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Theme
            grayColor="gray"
            accentColor="cyan"
            radius="medium"
            panelBackground="translucent"
          >
            {props.children}
          </Theme>
        </Providers>
        <Toaster closeButton richColors theme="system" />
      </body>
    </html>
  );
}
