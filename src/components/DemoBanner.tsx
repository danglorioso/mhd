"use client";

// Must be a Client Component: the tooltip trigger uses `asChild`, and a
// child element handed across the server/client boundary can arrive as a
// lazy reference that Radix renders as nothing, dropping the icon on hydrate.
import { Info, TriangleAlert } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DemoBanner() {
    return (
        <div className="w-full bg-amber-100 text-amber-900 text-sm py-1.5 px-4 border-b border-amber-200 shrink-0 flex items-center justify-center gap-2">
            <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
                This site is in <span className="font-semibold">DEMO MODE</span>
                .
            </span>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            aria-label="What does demo mode mean?"
                            className="inline-flex items-center justify-center rounded-full cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-900/50"
                        >
                            <Info className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent
                        side="bottom"
                        className="max-w-xs text-center leading-relaxed"
                    >
                        Every school, teacher, and project shown here is fake
                        sample data. Changes you make are temporary and reset
                        automatically, so nothing is saved permanently.
                        Exporting is turned off.
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
