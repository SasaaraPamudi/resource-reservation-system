import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).nullish();

export const resourceCreateSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().trim().min(1, "Name is required").max(150),
  description: optionalText(1000),
  location: optionalText(150),
  capacity: z.number().int().positive().max(100000).nullish(),
});

export const resourceUpdateSchema = resourceCreateSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });

export const createReservationSchema = z.object({
  resourceId: z.number().int().positive(),
  title: z.string().trim().min(1, "Title is required").max(200),
  notes: optionalText(1000),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  userName: z.string().trim().min(1, "Name is required").max(100),
  userEmail: z.string().trim().toLowerCase().email("Valid email is required").max(255),
  userTeam: optionalText(100),
});

export type ResourceCreateInput = z.infer<typeof resourceCreateSchema>;
export type ResourceUpdateInput = z.infer<typeof resourceUpdateSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
