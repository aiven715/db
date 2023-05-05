import z from "zod";

export type TodoEntry = z.infer<typeof schema>;

export const schema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
});
