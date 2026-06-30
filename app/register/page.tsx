import { registerDeviceAction } from "@/app/actions/devices"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function RegisterDevicePage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f7f9f9] p-6">
            <form
                action={registerDeviceAction}
                className="w-full max-w-md space-y-5 rounded-[2rem] bg-white p-8 shadow-sm"
            >
                <h1 className="text-3xl font-bold text-[#16262f]">
                    Register device
                </h1>

                <Input name="name" className="h-12" placeholder="Device name, e.g. St. George Dashboard" />

                <select
                    name="locationSlug"
                    className="h-12 w-full rounded-md border px-3"
                >
                    <option value="layton">Layton</option>
                    <option value="centerville">Centerville</option>
                    <option value="ogden">Ogden</option>
                    <option value="south-jordan">South Jordan</option>
                    <option value="cedar-city">Cedar City</option>
                    <option value="st-george">St. George</option>
                </select>

                <select
                    name="type"
                    className="h-12 w-full rounded-md border px-3"
                    defaultValue="kiosk"
                >
                    <option value="dashboard">Dashboard</option>
                    <option value="kiosk">Kiosk</option>
                </select>

                <Input
                    name="setupPassword"
                    className="h-12"
                    type="password"
                    placeholder="Setup password"
                    required
                />

                <Button className="h-12 w-full bg-[#2f6975] font-bold hover:bg-[#285a64]">
                    Register this device
                </Button>
            </form>
        </main>
    )
}