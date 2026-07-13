import { Volume2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function DashboardHeader({
    clock,
    location,
    onOpenSoundSettings,
}: {
    clock: string
    location: string
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
                    variant="ghost"
                    className="text-[#6f7f86] hover:bg-transparent"
                    onClick={onOpenSoundSettings}
                >
                    <Volume2 className="size-6 stroke-[2.3]" />
                </Button>
                <div className="text-lg font-semibold tabular-nums text-[#6f7f86]">{clock}</div>
            </div>
        </header>
    )
}
