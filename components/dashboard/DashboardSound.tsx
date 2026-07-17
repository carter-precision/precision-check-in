import { useState } from "react"
import { Volume2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const CHIME_SOUNDS = [
    { label: "Chime 1", path: "/sound-1.mp3" },
    { label: "Chime 2", path: "/sound-2.mp3" },
    { label: "Chime 3", path: "/sound-3.mp3" },
    { label: "Chime 4", path: "/sound-4.mp3" },
    { label: "Chime 5", path: "/sound-5.mp3" },
]

export function EnableSoundOverlay({ onEnableSound }: { onEnableSound: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#16262f]/80 px-6 backdrop-blur-sm">
            <button
                type="button"
                onClick={onEnableSound}
                className="w-full max-w-lg rounded-[2rem] bg-white p-10 text-center shadow-2xl transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
                <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-[#e7f1f2] text-[#2f6975]">
                    <Volume2 className="size-10" />
                </div>
                <h2 className="mb-3 text-4xl font-bold tracking-[-0.04em] text-[#16262f]">
                    Tap to enable sound
                </h2>
            </button>
        </div>
    )
}

export function SoundSettingsDialog({
    selectedSoundPath,
    onSelectSound,
    onClose,
}: {
    selectedSoundPath: string
    onSelectSound: (soundPath: string) => void
    onClose: () => void
}) {
    const [pendingSoundPath, setPendingSoundPath] = useState(selectedSoundPath)

    async function previewSound(soundPath: string) {
        setPendingSoundPath(soundPath)

        const audio = new Audio(soundPath)
        audio.volume = 1

        try {
            await audio.play()
        } catch (error) {
            console.error("Unable to preview sound:", error)
        }
    }

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="gap-0 rounded-[2rem] border border-[#d7e1e3] p-8 shadow-2xl sm:max-w-md">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-3xl font-bold tracking-[-0.04em] text-[#16262f]">
                        Chime sound
                    </DialogTitle>
                    <DialogDescription className="text-base font-medium text-muted-foreground">
                        Choose the sound this dashboard plays for new check-ins.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3">
                    {CHIME_SOUNDS.map((sound) => (
                        <button
                            key={sound.path}
                            type="button"
                            onClick={() => previewSound(sound.path)}
                            className={`cursor-pointer rounded-2xl border p-4 text-left font-bold transition ${pendingSoundPath === sound.path
                                ? "border-[#2f6975] bg-[#e7f1f2] text-[#2f6975]"
                                : "border-[#d7e1e3] bg-white text-[#16262f] hover:bg-[#f7f9f9]"
                                }`}
                        >
                            {sound.label}
                        </button>
                    ))}
                </div>

                <Button
                    type="button"
                    className="mt-6 h-12 w-full rounded-2xl bg-[#2f6975] font-bold hover:bg-[#285a64]"
                    onClick={() => {
                        onSelectSound(pendingSoundPath)
                        onClose()
                    }}
                >
                    Save
                </Button>
            </DialogContent>
        </Dialog>
    )
}
