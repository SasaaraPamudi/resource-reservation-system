import { notFound } from "next/navigation";
import ResourceForm from "@/components/ResourceForm";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { parseId } from "@/lib/http";
import { resourceService } from "@/server/container";

export const dynamic = "force-dynamic";

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let resource;
  try {
    resource = await resourceService.get(parseId(id));
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof ValidationError) notFound();
    throw err;
  }
  const categories = await resourceService.listCategories();
  return (
    <>
      <h1>Edit resource</h1>
      <p className="sub">{resource.name}</p>
      <ResourceForm categories={categories} resource={resource} />
    </>
  );
}
