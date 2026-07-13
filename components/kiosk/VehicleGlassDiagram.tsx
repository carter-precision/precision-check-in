import type { KeyboardEvent } from "react"

import type { GlassType } from "./types"

export function VehicleGlassDiagram({
    selected,
    onSelect,
}: {
    selected: GlassType | null
    onSelect: (glass: GlassType) => void
}) {
    function interactionProps(glass: GlassType, label: string) {
        return {
            role: "button",
            tabIndex: 0,
            "aria-label": label,
            className: glassClasses(selected === glass),
            onClick: () => onSelect(glass),
            onKeyDown: (event: KeyboardEvent<SVGElement>) => {
                if (event.key === "Enter" || event.key === " ") onSelect(glass)
            },
        }
    }

    return (
        <div className="rounded-[1.4rem] border border-[#d7e1e3] bg-white p-4 shadow-sm">
            <svg
                viewBox="0 0 300 470"
                className="mx-auto max-h-[46vh] w-full max-w-70"
                aria-label="Top view of vehicle glass panels"
            >
                <ellipse className="fill-[#d7e1e3]" cx="150" cy="452" rx="110" ry="10" />
                <rect className="fill-[#16262f]" x="46" y="118" width="24" height="58" rx="12" />
                <rect className="fill-[#16262f]" x="230" y="118" width="24" height="58" rx="12" />
                <rect className="fill-[#16262f]" x="46" y="298" width="24" height="58" rx="12" />
                <rect className="fill-[#16262f]" x="230" y="298" width="24" height="58" rx="12" />
                <path
                    className="fill-[#e7f1f2] stroke-[#2f6975] stroke-2"
                    d="M105,20 L195,20 A45,35 0 0 1 240,60 L240,400 A20,20 0 0 1 220,440 L80,440 A20,20 0 0 1 60,400 L60,60 A45,35 0 0 1 105,20 Z"
                />
                <rect className="fill-[#e7f1f2] stroke-[#2f6975]" x="75" y="146" width="150" height="198" rx="10" />
                <path
                    {...interactionProps("windshield", "Windshield")}
                    d="M108,72 L192,72 Q200,72 198,80 L188,138 Q186,144 180,144 L120,144 Q114,144 112,138 L102,80 Q100,72 108,72 Z"
                />
                <rect
                    {...interactionProps("sunroof", "Sunroof or moonroof")}
                    x="112"
                    y="184"
                    width="76"
                    height="106"
                    rx="18"
                />
                <path
                    {...interactionProps("back", "Back glass")}
                    d="M118,347 L182,347 Q188,347 189,353 L195,398 Q196,405 189,405 L111,405 Q104,405 105,398 L111,353 Q112,347 118,347 Z"
                />
                <rect {...interactionProps("driver_front", "Driver front window")} x="64" y="146" width="30" height="60" rx="10" />
                <rect {...interactionProps("driver_rear", "Driver rear window")} x="64" y="216" width="30" height="60" rx="10" />
                <path {...interactionProps("driver_quarter", "Driver quarter glass")} d="M64,286 L84,286 Q94,286 94,296 L94,330 Q94,340 84,342 L70,344 Q64,344 64,338 Z" />
                <rect {...interactionProps("passenger_front", "Passenger front window")} x="206" y="146" width="30" height="60" rx="10" />
                <rect {...interactionProps("passenger_rear", "Passenger rear window")} x="206" y="216" width="30" height="60" rx="10" />
                <path {...interactionProps("passenger_quarter", "Passenger quarter glass")} d="M236,286 L216,286 Q206,286 206,296 L206,330 Q206,340 216,342 L230,344 Q236,344 236,338 Z" />
            </svg>
        </div>
    )
}

function glassClasses(selected: boolean) {
    return selected
        ? "cursor-pointer fill-accent stroke-accent-shade stroke-2 outline-none"
        : "cursor-pointer fill-white stroke-[#2f6975] stroke-2 outline-none transition hover:fill-accent-tint focus:fill-accent-tint"
}
