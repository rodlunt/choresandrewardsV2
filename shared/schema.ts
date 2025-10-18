import { z } from "zod";

// Child schema
export const childSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  totalCents: z.number().int().min(0).default(0),
  favoriteChoreIds: z.array(z.string()).default([]),
  createdAt: z.date(),
});

export const insertChildSchema = childSchema.omit({
  id: true,
  totalCents: true,
  favoriteChoreIds: true,
  createdAt: true
});

export type Child = z.infer<typeof childSchema>;
export type InsertChild = z.infer<typeof insertChildSchema>;

// Chore schema
export const choreSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  valueCents: z.number().int().min(1, "Value must be at least 1 cent"),
  createdAt: z.date(),
});

export const insertChoreSchema = choreSchema.omit({
  id: true,
  createdAt: true
});

export type Chore = z.infer<typeof choreSchema>;
export type InsertChore = z.infer<typeof insertChoreSchema>;

// Payout history schema
export const payoutSchema = z.object({
  id: z.string(),
  childId: z.string(),
  childName: z.string(),
  amountCents: z.number().int().min(0),
  createdAt: z.date(),
});

export const insertPayoutSchema = payoutSchema.omit({ 
  id: true, 
  createdAt: true 
});

export type Payout = z.infer<typeof payoutSchema>;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;

// Settings schema
export const settingsSchema = z.object({
  sounds: z.boolean().default(true),
  haptics: z.boolean().default(true),
  confetti: z.boolean().default(true),
  displayMode: z.enum(['dollars', 'points']).default('dollars'),
});

export type Settings = z.infer<typeof settingsSchema>;

// App data backup schema for export/import
export const appDataSchema = z.object({
  children: z.array(childSchema),
  chores: z.array(choreSchema),
  payouts: z.array(payoutSchema),
  settings: settingsSchema,
  exportedAt: z.date(),
});

export type AppData = z.infer<typeof appDataSchema>;
