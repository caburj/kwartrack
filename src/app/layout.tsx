import "@radix-ui/themes/styles.css";
import "./globals.css";
import "../linear.scss";
import { Providers } from "./providers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { Positioned } from "@/utils/common";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kwartrack",
  description: "Yet another expense tracker",
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <ClerkProvider>
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
          <Positioned position="fixed" bottom="0" right="0" padding="1rem">
            <UserButton afterSignOutUrl="/" />
          </Positioned>
          <Toaster closeButton richColors theme="system" />
        </body>
      </ClerkProvider>
    </html>
  );
}
