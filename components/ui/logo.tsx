import Image from "next/image"

export function PrecisionLogo({
    size = 180,
}: {
    size?: number
}) {
    return (
        <Image
            src="/precision-logo.png"
            alt="Precision Auto Glass"
            width={size}
            height={0}
            priority
        />
    )
}