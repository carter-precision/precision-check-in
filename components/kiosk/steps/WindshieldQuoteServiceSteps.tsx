import { MapPin, Store } from "lucide-react"

import { KioskStep } from "../KioskPrimitives"
import {
    QuoteContinueButton,
    QuoteField,
    QuoteForm,
    QuoteHelperButton,
    QuoteInput,
    QuoteSelect,
    QuoteToggle,
} from "../QuoteForm"
import { VehicleGlassDiagram } from "../VehicleGlassDiagram"
import { GLASS_OPTIONS, getLocationLabel, KIOSK_LOCATIONS } from "../quote-options"
import type { GlassType, KioskStepProps } from "../types"

export function WindshieldGlassStep({ data, updateData, goTo, location }: KioskStepProps) {
    return (
        <KioskStep title="What needs replacing?">
            <QuoteForm>
                <p className="text-center text-lg font-medium text-muted-foreground">
                    Tap the damaged glass on the vehicle.
                </p>
                <VehicleGlassDiagram
                    selected={data.glassType}
                    onSelect={(glassType) => updateData({ glassType })}
                />

                <div className="text-center">
                    <QuoteHelperButton onClick={() => updateData({ glassType: "other" })}>
                        Not sure or multiple pieces
                    </QuoteHelperButton>
                </div>

                <QuoteField id="glass-type" label="Selected glass">
                    <QuoteSelect
                        id="glass-type"
                        value={data.glassType ?? ""}
                        onChange={(event) =>
                            updateData({
                                glassType: event.target.value
                                    ? (event.target.value as GlassType)
                                    : null,
                            })
                        }
                    >
                        <option value="">Choose the damaged glass</option>
                        {GLASS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </QuoteSelect>
                    <p className="text-center text-base font-medium text-muted-foreground">
                        Choose from the list or tap a glass panel on the vehicle.
                    </p>
                </QuoteField>

                <QuoteContinueButton
                    disabled={!data.glassType}
                    onClick={() =>
                        goTo("windshieldServiceLocation", {
                            shopLocation: data.shopLocation || location,
                        })
                    }
                />
            </QuoteForm>
        </KioskStep>
    )
}

export function WindshieldServiceLocationStep({ data, updateData, goTo, location }: KioskStepProps) {
    const selectedShop = data.shopLocation || location
    const canContinue =
        data.quoteServiceMode === "mobile"
            ? data.serviceAddress.trim().length > 3
            : data.quoteServiceMode === "shop" && Boolean(selectedShop)
    const locations = [
        ...KIOSK_LOCATIONS.filter((shop) => shop.slug === location),
        ...KIOSK_LOCATIONS.filter((shop) => shop.slug !== location),
    ]

    return (
        <KioskStep title="Where should we do the work?">
            <QuoteForm>
                <p className="text-center text-lg font-medium text-muted-foreground">
                    We can come to you, or you can visit one of our shops.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                    <QuoteToggle
                        selected={data.quoteServiceMode === "mobile"}
                        onClick={() => updateData({ quoteServiceMode: "mobile" })}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <MapPin className="size-5" />
                            We come to you
                        </span>
                    </QuoteToggle>
                    <QuoteToggle
                        selected={data.quoteServiceMode === "shop"}
                        onClick={() =>
                            updateData({ quoteServiceMode: "shop", shopLocation: selectedShop })
                        }
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Store className="size-5" />
                            I'll come in
                        </span>
                    </QuoteToggle>
                </div>

                {data.quoteServiceMode === "mobile" && (
                    <QuoteField id="service-address" label="Service address">
                        <QuoteInput
                            id="service-address"
                            value={data.serviceAddress}
                            placeholder="Street address, city"
                            onChange={(event) => updateData({ serviceAddress: event.target.value })}
                        />
                    </QuoteField>
                )}

                {data.quoteServiceMode === "shop" && (
                    <QuoteField id="shop-location" label="Shop location">
                        <QuoteSelect
                            id="shop-location"
                            value={selectedShop}
                            onChange={(event) => updateData({ shopLocation: event.target.value })}
                        >
                            {locations.map((shop) => (
                                <option key={shop.slug} value={shop.slug}>
                                    {shop.label}{shop.slug === location ? " (this location)" : ""}
                                </option>
                            ))}
                        </QuoteSelect>
                        <p className="text-sm font-medium text-muted-foreground">
                            {getLocationLabel(location)} is selected by default for this kiosk.
                        </p>
                    </QuoteField>
                )}

                <QuoteField id="preferred-date" label="Preferred date" optional>
                    <QuoteInput
                        id="preferred-date"
                        type="date"
                        value={data.preferredDate}
                        onChange={(event) => updateData({ preferredDate: event.target.value })}
                    />
                </QuoteField>

                <QuoteContinueButton disabled={!canContinue} onClick={() => goTo("windshieldContact")} />
            </QuoteForm>
        </KioskStep>
    )
}
