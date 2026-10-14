import ResourceForm from "@/components/ResourceForm";
import { resourceService } from "@/server/container";

export const dynamic = "force-dynamic";

export default async function NewResourcePage() {
  const categories = await resourceService.listCategories();
  return (
    <>
      <h1>Add resource</h1>
      <p className="sub">Register a new shared facility or piece of equipment.</p>
      <ResourceForm categories={categories} />
    </>
  );
}
