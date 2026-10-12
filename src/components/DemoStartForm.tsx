"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DemoStartForm({ redirectTo }: { redirectTo?: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const destination =
        redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
            ? redirectTo
            : "/";

    async function handleContinue() {
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("/api/demo/start", { method: "POST" });
            if (!res.ok) {
                setError("Couldn't start the demo. Please try again.");
                return;
            }
            router.push(destination);
        } catch {
            setError("Couldn't start the demo. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full md:w-1/2 h-full flex flex-col items-center p-6 overflow-y-auto">
            <div className="pt-8 pb-4">
                <Image
                    src="/images/mhs-logo-full.png"
                    alt="MHS Logo Image"
                    width={200}
                    height={73}
                    priority
                />
            </div>

            <div className="flex-1 flex items-center justify-center w-full max-w-md">
                <div className="w-full flex flex-col gap-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold">Sign In</h1>
                        <p className="text-[#646464]">
                            This is a demo of the Massachusetts History Day
                            dashboard, so no account is needed. Everything shown
                            is sample data, and any changes you make reset
                            automatically.
                        </p>
                    </div>

                    <div className="w-full space-y-8">
                        <Button
                            type="button"
                            className="w-full bg-[#1447E6]"
                            disabled={isLoading}
                            onClick={handleContinue}
                        >
                            {isLoading
                                ? "Starting demo..."
                                : "Continue as demo user"}
                        </Button>
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pb-8">
                <p className="text-[#646464] text-sm">
                    Created with ❤️ by {}
                    <a
                        href="https://jumbocode.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                    >
                        JumboCode
                    </a>
                </p>
            </div>
        </div>
    );
}
