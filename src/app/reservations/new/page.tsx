import ReservationForm from "@/components/ReservationForm";
import { resourceService } from "@/server/container";

export const dynamic = "force-dynamic";

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ resourceId?: string }>;
}) {
  const { resourceId } = await searchParams;
  const resources = await resourceService.list();
  return (
    <>
      <h1>New reservation</h1>
      <p className="sub">Choose what you need and when. We'll show what's already booked, so you can find a free slot fast.</p>
      <ReservationForm resources={resources} initialResourceId={Number(resourceId) || undefined} />
    </>
  );
}
