import { z } from "zod";

// Child schema
export const childSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  totalCents: z.number().int().min(0).default(0),
  favoriteChoreIds: z.array(z.string()).default([]),
  createdAt: z.coerce.date(),
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
  createdAt: z.coerce.date(),
});

export const insertChoreSchema = choreSchema.omit({
  id: true,
  createdAt: true
});

export type Chore = z.infer<typeof choreSchema>;
export type InsertChore = z.infer<typeof insertChoreSchema>;

// Completion schema
// Records an individual chore completion so real "N done" counts can be
// derived instead of estimated from totalCents. choreTitle is a snapshot
// taken at completion time (not a join on choreId) because chores are
// deletable and the completion should still read sensibly afterwards.
export const completionSchema = z.object({
  id: z.string(),
  childId: z.string(),
  choreId: z.string(),
  choreTitle: z.string(),
  valueCents: z.number().int().min(0),
  createdAt: z.coerce.date(),
});

export type Completion = z.infer<typeof completionSchema>;

// Payout history schema
// Deliberately has no childName snapshot: AppStorage.deleteChild cascades a
// child's payouts when the child is deleted, so a payout can never outlive
// its child and the name is always resolved by joining on childId at
// display time (see HistoryPage). Old backups that still carry childName
// parse fine, since zod strips unknown keys by default; the field just
// never gets read or written again.
export const payoutSchema = z.object({
  id: z.string(),
  childId: z.string(),
  amountCents: z.number().int().min(0),
  createdAt: z.coerce.date(),
});

export const insertPayoutSchema = payoutSchema.omit({
  id: true,
  createdAt: true
});

export type Payout = z.infer<typeof payoutSchema>;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;

// Settings schema
export const settingsSchema = z.object({
  haptics: z.boolean().default(true),
  confetti: z.boolean().default(true),
  displayMode: z.enum(['dollars', 'points']).default('dollars'),
  // Optional parent PIN, stored only as a salted SHA-256 hash (see
  // client/src/lib/pin.ts) - never the PIN itself. Both fields are present
  // together or absent together; undefined means no PIN is set and every
  // gated action behaves exactly as if PINs didn't exist.
  pinHash: z.string().optional(),
  pinSalt: z.string().optional(),
});

export type Settings = z.infer<typeof settingsSchema>;

// App data backup schema for export/import
export const appDataSchema = z.object({
  children: z.array(childSchema),
  chores: z.array(choreSchema),
  payouts: z.array(payoutSchema),
  // Defaults to [] so a legacy backup taken before completions existed
  // still imports cleanly instead of failing validation.
  completions: z.array(completionSchema).default([]),
  settings: settingsSchema,
  exportedAt: z.coerce.date(),
});

export type AppData = z.infer<typeof appDataSchema>;

// Bug report / feature request schema
// Single source of truth for the payload shape shared by the client
// (BugReport.tsx) and the server (routes/issues.ts), so a rename on either
// side fails type-checking instead of breaking silently at runtime.
export const bugReportCategories = [
  'User Interface',
  'Chores Management',
  'Child Management',
  'Rewards/Payouts',
  'Settings',
  'PWA/Offline',
  'Performance',
  'Other',
] as const;

const technicalInfoFieldSchema = z.string().max(500);

export const bugReportSchema = z.object({
  issueType: z.enum(['bug', 'feature']),
  category: z.enum(bugReportCategories),
  description: z.string().min(1, 'Description is required').max(5000),
  stepsToReproduce: z.string().max(5000).optional(),
  expectedBehavior: z.string().max(5000).optional(),
  actualBehavior: z.string().max(5000).optional(),
  screenshot: z
    .string()
    .startsWith('data:image/', 'Screenshot must be a data:image/* URL')
    .nullable()
    .optional(),
  technicalInfo: z.object({
    timestamp: technicalInfoFieldSchema,
    userAgent: technicalInfoFieldSchema,
    url: technicalInfoFieldSchema,
    resolution: technicalInfoFieldSchema,
    appVersion: technicalInfoFieldSchema,
    buildNumber: technicalInfoFieldSchema,
  }),
});

export type BugReportPayload = z.infer<typeof bugReportSchema>;
