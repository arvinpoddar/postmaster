import { z } from 'zod';

const messageSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  data: z.unknown(),
  timestamp: z.number(),
  datetime: z.number(),
});

export type PostMessage = z.infer<typeof messageSchema>;

export function parseMessage(message: unknown): PostMessage | null {
  const res = messageSchema.safeParse(message);
  if (res.success) return res.data;
  return null;
}
