import { z } from "zod";

export const CreateUserDto = z.object({
  email: z.string().email(),
  name: z.string().min(1)
});
export const UpdateUserDto = CreateUserDto.partial();

export type CreateUserDto = z.infer<typeof CreateUserDto>;
export type UpdateUserDto = z.infer<typeof UpdateUserDto>;
