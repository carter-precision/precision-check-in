import { QuoteContinueButton, QuoteField, QuoteForm, QuoteHelperButton, QuoteInput, QuoteSelect, QuoteToggle } from "../QuoteForm"
import { INSURANCE_CARRIERS, VEHICLE_FEATURES, VEHICLE_YEARS } from "../quote-options"
import type { KioskStepProps, VehicleFeature } from "../types"
import { KioskStep } from "../KioskPrimitives"

export function WindshieldInsuranceDetailsStep({ data, updateData, goTo }: KioskStepProps) {
    const canContinue =
        data.insuranceCarrier.trim().length > 0 &&
        data.policyHolderName.trim().length > 1 &&
        data.policyHolderPhone.replace(/\D/g, "").length >= 7

    return (
        <KioskStep title="Tell us about your coverage">
            <QuoteForm>
                <p className="text-center text-lg font-medium text-muted-foreground">
                    We'll confirm these details directly with your carrier.
                </p>

                <QuoteField id="insurance-carrier" label="Insurance carrier">
                    <QuoteInput
                        id="insurance-carrier"
                        list="insurance-carriers"
                        value={data.insuranceCarrier}
                        placeholder="Start typing, e.g. State Farm"
                        onChange={(event) => updateData({ insuranceCarrier: event.target.value })}
                    />
                    <datalist id="insurance-carriers">
                        {INSURANCE_CARRIERS.map((carrier) => <option key={carrier} value={carrier} />)}
                    </datalist>
                </QuoteField>

                <QuoteField id="policy-holder-name" label="Policy holder name">
                    <QuoteInput
                        id="policy-holder-name"
                        value={data.policyHolderName}
                        placeholder="Full name on the policy"
                        onChange={(event) => updateData({ policyHolderName: event.target.value })}
                    />
                </QuoteField>

                <QuoteField id="policy-holder-phone" label="Policy holder phone">
                    <QuoteInput
                        id="policy-holder-phone"
                        type="tel"
                        inputMode="tel"
                        value={data.policyHolderPhone}
                        placeholder="(801) 555-0100"
                        onChange={(event) => updateData({ policyHolderPhone: event.target.value })}
                    />
                </QuoteField>

                <div className="grid gap-5 md:grid-cols-2">
                    <QuoteField id="policy-number" label="Policy number" optional>
                        <QuoteInput
                            id="policy-number"
                            value={data.policyNumber}
                            placeholder="Found on your insurance card"
                            onChange={(event) => updateData({ policyNumber: event.target.value })}
                        />
                    </QuoteField>
                    <QuoteField id="service-zip" label="Service postal code" optional>
                        <QuoteInput
                            id="service-zip"
                            inputMode="numeric"
                            maxLength={5}
                            value={data.serviceZip}
                            placeholder="84045"
                            onChange={(event) =>
                                updateData({ serviceZip: event.target.value.replace(/\D/g, "").slice(0, 5) })
                            }
                        />
                    </QuoteField>
                </div>

                <VehicleIdentityFields data={data} updateData={updateData} optional />

                <QuoteField label="Do you know your deductible?" optional>
                    <div className="grid grid-cols-2 gap-3">
                        <QuoteToggle
                            selected={data.knowsDeductible === true}
                            onClick={() => updateData({ knowsDeductible: true })}
                        >
                            Yes
                        </QuoteToggle>
                        <QuoteToggle
                            selected={data.knowsDeductible === false}
                            onClick={() => updateData({ knowsDeductible: false, deductibleAmount: "" })}
                        >
                            Not sure
                        </QuoteToggle>
                    </div>
                </QuoteField>

                {data.knowsDeductible === true && (
                    <QuoteField id="deductible" label="Deductible amount">
                        <QuoteInput
                            id="deductible"
                            inputMode="decimal"
                            value={data.deductibleAmount}
                            placeholder="$250"
                            onChange={(event) => updateData({ deductibleAmount: event.target.value })}
                        />
                    </QuoteField>
                )}

                {data.knowsDeductible === false && (
                    <p className="rounded-xl bg-accent-tint p-4 text-base font-medium text-[#40525a]">
                        No problem. We'll verify your coverage and deductible before any work is scheduled.
                    </p>
                )}

                <QuoteContinueButton disabled={!canContinue} onClick={() => goTo("windshieldGlass")} />
            </QuoteForm>
        </KioskStep>
    )
}

export function WindshieldVehicleStep({ data, updateData, goTo }: KioskStepProps) {
    const hasVehicle = data.vinUnknown
        ? Boolean(data.vehicleYear && data.vehicleMake.trim() && data.vehicleModel.trim())
        : data.vin.trim().length >= 4

    return (
        <KioskStep title="Tell us about your vehicle">
            <QuoteForm>
                <p className="text-center text-lg font-medium text-muted-foreground">
                    Your VIN gives us the exact glass specification with no guessing.
                </p>

                <VehicleIdentityFields data={data} updateData={updateData} />

                {data.vinUnknown && (
                    <QuoteField label="Does your vehicle have any of these?" optional>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {VEHICLE_FEATURES.map((feature) => (
                                <QuoteToggle
                                    key={feature.value}
                                    selected={data.vehicleFeatures.includes(feature.value)}
                                    onClick={() =>
                                        updateData({
                                            vehicleFeatures: toggleFeature(data.vehicleFeatures, feature.value),
                                        })
                                    }
                                >
                                    {feature.label}
                                </QuoteToggle>
                            ))}
                        </div>
                    </QuoteField>
                )}

                <QuoteContinueButton disabled={!hasVehicle} onClick={() => goTo("windshieldGlass")} />
            </QuoteForm>
        </KioskStep>
    )
}

function VehicleIdentityFields({
    data,
    updateData,
    optional = false,
}: Pick<KioskStepProps, "data" | "updateData"> & { optional?: boolean }) {
    if (!data.vinUnknown) {
        return (
            <QuoteField id="vehicle-vin" label="VIN" optional={optional}>
                <QuoteInput
                    id="vehicle-vin"
                    value={data.vin}
                    maxLength={17}
                    autoCapitalize="characters"
                    placeholder="17-character VIN"
                    onChange={(event) => updateData({ vin: event.target.value.toUpperCase() })}
                />
                <QuoteHelperButton onClick={() => updateData({ vinUnknown: true, vin: "" })}>
                    I don't have my VIN
                </QuoteHelperButton>
            </QuoteField>
        )
    }

    return (
        <div className="space-y-5 rounded-[1.4rem] border border-[#d7e1e3] bg-white p-5 shadow-sm">
            <QuoteField id="vehicle-year" label="Vehicle year" optional={optional}>
                <QuoteSelect
                    id="vehicle-year"
                    value={data.vehicleYear}
                    onChange={(event) => updateData({ vehicleYear: event.target.value })}
                >
                    <option value="">Select year</option>
                    {VEHICLE_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
                </QuoteSelect>
            </QuoteField>
            <div className="grid gap-5 md:grid-cols-2">
                <QuoteField id="vehicle-make" label="Vehicle make" optional={optional}>
                    <QuoteInput
                        id="vehicle-make"
                        value={data.vehicleMake}
                        placeholder="Toyota"
                        onChange={(event) => updateData({ vehicleMake: event.target.value })}
                    />
                </QuoteField>
                <QuoteField id="vehicle-model" label="Vehicle model" optional={optional}>
                    <QuoteInput
                        id="vehicle-model"
                        value={data.vehicleModel}
                        placeholder="Camry"
                        onChange={(event) => updateData({ vehicleModel: event.target.value })}
                    />
                </QuoteField>
            </div>
            <QuoteHelperButton onClick={() => updateData({ vinUnknown: false })}>
                Actually, I have my VIN
            </QuoteHelperButton>
        </div>
    )
}

function toggleFeature(current: VehicleFeature[], feature: VehicleFeature): VehicleFeature[] {
    if (feature === "none") return current.includes("none") ? [] : ["none"]

    const withoutNone = current.filter((value) => value !== "none")
    return withoutNone.includes(feature)
        ? withoutNone.filter((value) => value !== feature)
        : [...withoutNone, feature]
}
