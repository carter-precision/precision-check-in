import { MoveUpLeft } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center gap-6 h-lvh">
      <MoveUpLeft className="size-12 bg-[#d1d1d1] rounded-full p-2" stroke="#fff" />
      Use toggle above to view pages.
    </div>
  )
}
