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
                viewBox="0 0 420 700"
                className="mx-auto max-h-[58vh] w-full max-w-90"
                aria-label="Top view of vehicle glass panels"
            >
                <defs>
                    <linearGradient id="vehicle-body" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#f8fbfb" />
                        <stop offset="1" stopColor="#e4eff1" />
                    </linearGradient>
                    <filter id="vehicle-shadow" x="-20%" y="-100%" width="140%" height="300%">
                        <feGaussianBlur stdDeviation="7" />
                    </filter>
                </defs>

                <ellipse
                    cx="210"
                    cy="677"
                    rx="132"
                    ry="12"
                    className="fill-[#9fb4b9]/35"
                    filter="url(#vehicle-shadow)"
                />

                <rect className="fill-[#16262f]" x="57" y="130" width="30" height="80" rx="14" />
                <rect className="fill-[#16262f]" x="333" y="130" width="30" height="80" rx="14" />
                <rect className="fill-[#16262f]" x="57" y="467" width="30" height="82" rx="14" />
                <rect className="fill-[#16262f]" x="333" y="467" width="30" height="82" rx="14" />

                <path
                    d="M210 18 C145 18 104 31 88 68 C82 83 80 101 80 123 L80 575 C80 642 123 679 210 682 C297 679 340 642 340 575 L340 123 C340 101 338 83 332 68 C316 31 275 18 210 18 Z"
                    fill="url(#vehicle-body)"
                    className="stroke-[#2f6975] stroke-[2.5]"
                />

                <path
                    d="M118 51 C145 35 176 30 210 30 C244 30 275 35 302 51 C320 72 326 96 326 127 L326 570 C326 624 287 657 210 662 C133 657 94 624 94 570 L94 127 C94 96 100 72 118 51 Z"
                    className="fill-none stroke-white/80 stroke-7"
                />

                <path
                    d="M82 193 L58 205 Q49 210 52 219 L55 227 Q58 233 66 229 L82 219 Z"
                    className="fill-[#f5fafb] stroke-[#2f6975] stroke-2"
                />
                <path
                    d="M338 193 L362 205 Q371 210 368 219 L365 227 Q362 233 354 229 L338 219 Z"
                    className="fill-[#f5fafb] stroke-[#2f6975] stroke-2"
                />

                <path
                    {...interactionProps("windshield", "Windshield")}
                    d="M112 150 Q210 121 308 150 Q318 153 314 168 L294 230 Q290 243 278 239 Q210 225 142 239 Q130 243 126 230 L106 168 Q102 153 112 150 Z"
                />

                <path
                    {...interactionProps("driver_front", "Driver front window")}
                    d="M96 186 Q102 179 109 192 Q132 233 133 273 L133 340 Q133 347 127 347 L94 345 L94 205 Q94 190 96 186 Z"
                />
                <path
                    {...interactionProps("passenger_front", "Passenger front window")}
                    d="M324 186 Q318 179 311 192 Q288 233 287 273 L287 340 Q287 347 293 347 L326 345 L326 205 Q326 190 324 186 Z"
                />

                <rect
                    {...interactionProps("sunroof", "Sunroof or moonroof")}
                    x="166"
                    y="274"
                    width="88"
                    height="121"
                    rx="18"
                />

                <path
                    {...interactionProps("driver_rear", "Driver rear window")}
                    d="M94 357 L133 357 L132 431 Q130 454 108 479 Q100 489 97 478 Q93 459 94 438 Z"
                />
                <path
                    {...interactionProps("passenger_rear", "Passenger rear window")}
                    d="M326 357 L287 357 L288 431 Q290 454 312 479 Q320 489 323 478 Q327 459 326 438 Z"
                />

                <path
                    {...interactionProps("driver_quarter", "Driver quarter glass")}
                    d="M102 484 L113 474 Q118 469 120 476 L116 516 Q115 527 110 523 L101 510 Q97 502 102 484 Z"
                />
                <path
                    {...interactionProps("passenger_quarter", "Passenger quarter glass")}
                    d="M318 484 L307 474 Q302 469 300 476 L304 516 Q305 527 310 523 L319 510 Q323 502 318 484 Z"
                />

                <path
                    {...interactionProps("back", "Back glass")}
                    d="M143 493 Q210 506 277 493 Q289 491 292 503 L307 572 Q309 585 298 591 Q210 620 122 591 Q111 585 113 572 L128 503 Q131 491 143 493 Z"
                />
            </svg>
        </div>
    )
}

function glassClasses(selected: boolean) {
    return selected
        ? "cursor-pointer fill-accent stroke-accent-shade stroke-[2.5] outline-none"
        : "cursor-pointer fill-[#f8fbfb] stroke-[#2f6975] stroke-[2.5] outline-none transition hover:fill-accent-tint focus:fill-accent-tint"
}
