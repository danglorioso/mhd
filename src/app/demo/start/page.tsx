import type { Metadata } from "next";
import DemoStartForm from "@/components/DemoStartForm";
import WarpShader from "@/components/WarpShader";

export const metadata: Metadata = {
    title: "Demo",
};

export default async function DemoStartPage({
    searchParams,
}: {
    searchParams: Promise<{ redirect?: string }>;
}) {
    const { redirect } = await searchParams;
    return (
        <div className="flex h-screen flex-col items-center justify-center">
            <div className="w-full h-full flex flex-row">
                <DemoStartForm redirectTo={redirect} />
                <div className="w-1/2 h-full hidden md:block">
                    <WarpShader
                        colorFront={{ r: 0.784, g: 0.192, b: 0.22, a: 1 }}
                        colorBack={{ r: 1.0, g: 0.498, b: 0.525, a: 1 }}
                    />
                </div>
            </div>
        </div>
    );
}
