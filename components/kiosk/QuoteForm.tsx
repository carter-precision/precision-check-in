import type { ReactNode, SelectHTMLAttributes } from "react"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function QuoteForm({ children }: { children: ReactNode }) {
    return <div className="mx-auto w-full max-w-3xl space-y-5 pb-8">{children}</div>
}

export function QuoteField({
    id,
    label,
    optional = false,
    children,
}: {
    id?: string
    label: string
    optional?: boolean
    children: ReactNode
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-base font-bold text-[#40525a]">
                {label}
                {optional && <span className="font-medium text-muted-foreground">Optional</span>}
            </Label>
            {children}
        </div>
    )
}

export function QuoteInput({ className, ...props }: React.ComponentProps<typeof Input>) {
    return (
        <Input
            className={cn(
                "h-14 rounded-xl border-[#d7e1e3] bg-white px-4 text-lg shadow-sm placeholder:text-[#9aa8ad]",
                className,
            )}
            {...props}
        />
    )
}

export function QuoteSelect({
    className,
    children,
    ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            className={cn(
                "h-14 w-full rounded-xl border border-[#d7e1e3] bg-white px-4 text-lg font-medium text-[#16262f] shadow-sm outline-none focus:border-accent focus:ring-3 focus:ring-accent/20",
                className,
            )}
            {...props}
        >
            {children}
        </select>
    )
}

export function QuoteToggle({
    selected,
    children,
    onClick,
}: {
    selected: boolean
    children: ReactNode
    onClick: () => void
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onClick}
            className={cn(
                "min-h-13 rounded-xl border px-4 py-3 text-base font-bold transition",
                selected
                    ? "border-accent bg-accent-tint text-[#16262f] shadow-sm"
                    : "border-[#d7e1e3] bg-white text-muted-foreground hover:border-[#a9c7ce]",
            )}
        >
            {children}
        </button>
    )
}

export function QuoteContinueButton({
    children = "Continue",
    disabled,
    onClick,
}: {
    children?: ReactNode
    disabled?: boolean
    onClick: () => void
}) {
    return (
        <Button
            className="h-16 w-full rounded-2xl bg-accent text-xl font-bold shadow-lg shadow-accent/20 hover:bg-accent-shade"
            disabled={disabled}
            onClick={onClick}
        >
            {children}
            <ArrowRight className="size-5" />
        </Button>
    )
}

export function QuoteHelperButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="text-base font-bold text-accent underline decoration-2 underline-offset-4"
        >
            {children}
        </button>
    )
}
