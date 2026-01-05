import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const drawings = sqliteTable("drawings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  imageData: text("image_data").notNull(), // Base64 encoded image
  thumbnail: text("thumbnail"), // Smaller base64 thumbnail for gallery
  shareToken: text("share_token"), // Unique token for public sharing
  isPublic: integer("is_public", { mode: "boolean" }).default(false), // Whether the drawing is publicly shared
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Drawing = typeof drawings.$inferSelect;
export type NewDrawing = typeof drawings.$inferInsert;
