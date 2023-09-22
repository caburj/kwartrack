import "@radix-ui/themes/styles.css";
import { Providers } from "./providers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Theme } from "@radix-ui/themes";

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
          <Theme scaling="95%" accentColor="cyan" radius="small">
            {props.children}
          </Theme>
        </Providers>
      </body>
    </html>
  );
}
