import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const lmsUsersTable = pgTable("lms_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lmsCoursesTable = pgTable("lms_courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().unique(),
  description: text("description").notNull(),
  level: text("level").notNull(),
  lessons: integer("lessons").notNull(),
});