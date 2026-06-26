export default async function CheckInPage({
    params,
}: {
    params: Promise<{ location: string }>
}) {
    const { location } = await params

    return <div></div>
}