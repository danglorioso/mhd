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
                    height={100}
                    priority
                />
            </div>

            <div className="flex-1 flex items-center justify-center w-full max-w-md">
                <div className="w-full flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                        <h1 className="text-3xl font-bold">Demo</h1>
                        <div className="text-sm text-amber-900 bg-amber-100 border border-amber-200 rounded p-3">
                            Demo only — every school, teacher, and project shown
                            here is fake sample data. Edits are private to your
                            visit and reset automatically; nothing is saved
                            permanently.
                        </div>
                    </div>

                    <div className="w-full flex flex-col gap-4">
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
        </div>
    );
}
