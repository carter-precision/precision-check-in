"use client"

import { useEffect, useRef, useState } from "react"

const CHIME_ESCALATION_DELAY_MS = 8000
const CHIME_REPEAT_INTERVAL_MS = 3000
const CHIME_STORAGE_KEY = "pag_chime_enabled"

type UseCheckInChimeOptions = {
    soundPath?: string
}

export function useCheckInChime(
    shouldChime: boolean,
    options: UseCheckInChimeOptions = {},
) {
    const soundPath = options.soundPath ?? "/soft-tone.mp3"

    const escalationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const repeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const [isChimeEnabled, setIsChimeEnabled] = useState(true)
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false)

    useEffect(() => {
        const stored = window.localStorage.getItem(CHIME_STORAGE_KEY)

        if (stored === "false") {
            setIsChimeEnabled(false)
        }
    }, [])

    useEffect(() => {
        const audio = new Audio(soundPath)
        audio.preload = "auto"
        audio.volume = 1

        audioRef.current = audio

        return () => {
            stopChimeLoop()
            audio.pause()
            audioRef.current = null
        }
    }, [soundPath])

    async function playChime() {
        if (!audioRef.current || !isChimeEnabled || !isAudioUnlocked) return

        try {
            audioRef.current.currentTime = 0
            await audioRef.current.play()
        } catch (error) {
            console.error("Unable to play chime:", error)
            setIsAudioUnlocked(false)
        }
    }

    function stopChimeLoop() {
        if (escalationTimeoutRef.current) {
            clearTimeout(escalationTimeoutRef.current)
            escalationTimeoutRef.current = null
        }

        if (repeatIntervalRef.current) {
            clearInterval(repeatIntervalRef.current)
            repeatIntervalRef.current = null
        }

        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
    }

    useEffect(() => {
        stopChimeLoop()

        if (!shouldChime || !isChimeEnabled || !isAudioUnlocked) return

        playChime()

        escalationTimeoutRef.current = setTimeout(() => {
            playChime()

            repeatIntervalRef.current = setInterval(() => {
                playChime()
            }, CHIME_REPEAT_INTERVAL_MS)
        }, CHIME_ESCALATION_DELAY_MS)

        return stopChimeLoop
    }, [shouldChime, isChimeEnabled, isAudioUnlocked])

    async function enableChime() {
        setIsChimeEnabled(true)
        window.localStorage.setItem(CHIME_STORAGE_KEY, "true")

        try {
            if (audioRef.current) {
                audioRef.current.volume = 0
                await audioRef.current.play()
                audioRef.current.pause()
                audioRef.current.currentTime = 0
                audioRef.current.volume = 1
            }

            setIsAudioUnlocked(true)
        } catch (error) {
            console.error("Unable to unlock audio:", error)
            setIsAudioUnlocked(false)
        }
    }

    function disableChime() {
        setIsChimeEnabled(false)
        setIsAudioUnlocked(false)
        window.localStorage.setItem(CHIME_STORAGE_KEY, "false")
        stopChimeLoop()
    }

    return {
        isChimeEnabled,
        isAudioUnlocked,
        enableChime,
        disableChime,
    }
}