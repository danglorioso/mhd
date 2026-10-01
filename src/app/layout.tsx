/***************************************************************
 *
 *                layout.tsx
 *
 *         Author: Anne, Jack
 *           Date: 1/30/2026
 *
 *
 **************************************************************/

import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "sonner";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { dmSans, millerBanner, millerDisplay, millerText } from "@/app/fonts";
import ConditionalLayout from "@/components/ConditionalLayout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UnsavedChangesProvider } from "@/components/UnsavedChangesContext";
import { CartProvider } from "@/hooks/useCart";
import { Suspense } from "react";
import InvalidURLHandler from "@/components/InvalidURLHandler";
import DemoBanner from "@/components/DemoBanner";

const IS_DEMO = process.env.IS_DEMO === "true";

export const metadata: Metadata = {
    title: {
        template: "%s | MHD",
        default: "MHD",
    },
    description:
        "Data visualization dashboard for Massachusetts History Society's annual contest, Massachusetts History Day.",
    icons: { icon: "/favicon.png" },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${millerBanner.variable} ${millerDisplay.variable} ${millerText.variable} ${dmSans.variable}`}
        >
            <body className="font-sans flex flex-col h-screen overflow-hidden">
                {IS_DEMO && <DemoBanner />}
                <div className="flex flex-row flex-1 min-h-0">
                    <UnsavedChangesProvider>
                        <NuqsAdapter>
                            <CartProvider>
                                <ConditionalLayout>
                                    <TooltipProvider>
                                        {children}
                                    </TooltipProvider>
                                </ConditionalLayout>
                            </CartProvider>
                        </NuqsAdapter>
                    </UnsavedChangesProvider>
                </div>
                <Toaster />
                <Suspense>
                    <InvalidURLHandler />
                </Suspense>
            </body>
        </html>
    );
}
