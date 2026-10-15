import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { resourceCreateSchema, resourceUpdateSchema } from "@/lib/validation";
import type { Category, Resource } from "@/types";
import type { CategoryRepository } from "../repositories/category-repository";
import type { ReservationRepository } from "../repositories/reservation-repository";
import type { ResourceRepository } from "../repositories/resource-repository";

export class ResourceService {
  constructor(
    private readonly resources: ResourceRepository,
    private readonly categories: CategoryRepository,
    private readonly reservations: ReservationRepository,
  ) {}

  list(opts: { includeInactive?: boolean; categoryId?: number } = {}): Promise<Resource[]> {
    return this.resources.findAll(opts);
  }

  listCategories(): Promise<Category[]> {
    return this.categories.findAll();
  }

  async get(id: number): Promise<Resource> {
    const resource = await this.resources.findById(id);
    if (!resource) throw new NotFoundError("Resource not found");
    return resource;
  }

  async create(input: unknown): Promise<Resource> {
    const data = resourceCreateSchema.parse(input);
    await this.assertCategoryExists(data.categoryId);
    return this.resources.create(data);
  }

  async update(id: number, input: unknown): Promise<Resource> {
    const patch = resourceUpdateSchema.parse(input);
    await this.get(id);
    if (patch.categoryId !== undefined) await this.assertCategoryExists(patch.categoryId);

    if (patch.isActive === false) {
      const upcoming = await this.reservations.countUpcomingForResource(id);
      if (upcoming > 0) {
        throw new ConflictError(
          `This resource has ${upcoming} upcoming reservation(s). Cancel them before deactivating it.`,
        );
      }
    }
    return this.resources.update(id, patch);
  }

  private async assertCategoryExists(categoryId: number) {
    if (!(await this.categories.exists(categoryId))) {
      throw new ValidationError("Selected category does not exist");
    }
  }
}
