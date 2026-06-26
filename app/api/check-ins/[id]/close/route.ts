import { NextResponse } from "next/server"

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params

    return NextResponse.json(
        {
            error: "Not implemented",
            id,
        },
        {
            status: 501,
        },
    )
}