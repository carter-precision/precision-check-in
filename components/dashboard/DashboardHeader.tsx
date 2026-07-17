import { BookOpen, Volume2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function DashboardHeader({
    clock,
    location,
    onOpenShopFlowGuide,
    onOpenSoundSettings,
}: {
    clock: string
    location: string
    onOpenShopFlowGuide: () => void
    onOpenSoundSettings: () => void
}) {
    return (
        <header className="flex items-center justify-between px-0.5">
            <div>
                <h1 className="text-3xl font-bold capitalize tracking-[-0.04em] text-[#16262f]">
                    {location.replaceAll("-", " ") || "Front desk"}
                </h1>
                <p className="text-base font-medium capitalize text-[#6f7f86]">
                    Live customer activity
                </p>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="mr-2 rounded-xl bg-[#e7f1f2] p-6 text-[#2f6975] hover:bg-[#e5f4ed] hover:text-[#3b8d65]"
                    onClick={onOpenShopFlowGuide}
                    aria-label="Open shop flow guide"
                    title="Shop flow guide"
                >
                    <BookOpen className="size-[2.1rem] stroke-[1.8]" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    className="rounded-xl text-[#6f7f86] hover:bg-[#e7f1f2] hover:text-[#2f6975]"
                    onClick={onOpenSoundSettings}
                    aria-label="Choose chime sound"
                    title="Chime sound"
                >
                    <Volume2 className="size-6 stroke-[2.3]" />
                </Button>
                <div className="text-lg font-semibold tabular-nums text-[#6f7f86]">{clock}</div>
            </div>
        </header>
    )
}
