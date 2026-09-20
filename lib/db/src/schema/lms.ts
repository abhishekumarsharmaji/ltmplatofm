import { integer, pgTable, serial, text, timestamp, pgEnum, boolean, uniqueIndex, index, check, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const lmsUsersTable = pgTable("lms_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("student"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const lmsCoursesTable = pgTable("lms_courses", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id"),
  status: text("status").notNull().default("draft"),
  title: text("title").notNull().unique(),
  description: text("description").notNull(),
  level: text("level").notNull(),
  lessons: integer("lessons").notNull(),
});

export const roleEnum = pgEnum("user_role", ["student", "creator", "admin"]);
export const courseStatusEnum = pgEnum("course_status", ["draft", "published", "archived"]);
export const productTypeEnum = pgEnum("product_type", ["course", "digital"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "cancelled", "refunded"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "succeeded", "failed", "refunded"]);
export const fileKindEnum = pgEnum("file_kind", ["video", "document", "audio", "image", "other"]);
export const accessPlanEnum = pgEnum("access_plan", ["lifetime", "fixed_days", "monthly", "yearly"]);

/** Normalized application identity. lms_users remains for backwards-compatible auth data. */
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("student"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("users_email_unique").on(t.email), index("users_role_idx").on(t.role)]);

export const creatorProfilesTable = pgTable("creator_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  username: text("username"),
  headline: text("headline").notNull().default(""),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  avatarObjectPath: text("avatar_object_path"),
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("creator_profiles_user_unique").on(t.userId),
  uniqueIndex("creator_profiles_username_unique").on(t.username),
]);

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("categories_slug_unique").on(t.slug)]);

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => usersTable.id),
  categoryId: integer("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description").notNull().default(""),
  thumbnailUrl: text("thumbnail_url"),
  thumbnailObjectPath: text("thumbnail_object_path"),
  outcomes: text("outcomes").array().notNull().default(sql`ARRAY[]::text[]`),
  faqs: jsonb("faqs").$type<Array<{ question: string; answer: string }>>().notNull().default(sql`'[]'::jsonb`),
  level: text("level").notNull().default("all"),
  status: courseStatusEnum("status").notNull().default("draft"),
  priceMinor: integer("price_minor").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
}, (t) => [
  uniqueIndex("courses_slug_unique").on(t.slug),
  index("courses_creator_idx").on(t.creatorId),
  index("courses_status_created_idx").on(t.status, t.createdAt),
  index("courses_status_category_idx").on(t.status, t.categoryId),
  check("courses_price_nonnegative", sql`${t.priceMinor} >= 0`),
]);

export const courseModulesTable = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
}, (t) => [uniqueIndex("course_modules_position_unique").on(t.courseId, t.position)]);

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => courseModulesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  isPreview: boolean("is_preview").notNull().default(false),
}, (t) => [uniqueIndex("lessons_position_unique").on(t.moduleId, t.position)]);

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => usersTable.id),
  courseId: integer("course_id").references(() => coursesTable.id, { onDelete: "set null" }),
  categoryId: integer("category_id").references(() => categoriesTable.id, { onDelete: "set null" }),
  type: productTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  shortSummary: text("short_summary"),
  subtype: text("subtype"),
  publicSlug: text("public_slug"),
  coverImageUrl: text("cover_image_url"),
  coverImageObjectPath: text("cover_image_object_path"),
  salesPage: jsonb("sales_page").$type<{
    tagline?: string;
    ctaLabel?: string;
    benefits?: string[];
    targetAudience?: string[];
    includedItems?: string[];
    sections?: Array<{ heading: string; body: string }>;
    testimonials?: Array<{ name: string; quote: string }>;
    faqs?: Array<{ question: string; answer: string }>;
    supportEmail?: string;
    terms?: string;
  }>().notNull().default(sql`'{}'::jsonb`),
  priceMinor: integer("price_minor").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  accessPlan: accessPlanEnum("access_plan").notNull().default("lifetime"),
  accessDays: integer("access_days"),
  trialDays: integer("trial_days").notNull().default(0),
  status: courseStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("products_creator_idx").on(t.creatorId),
  index("products_status_created_idx").on(t.status, t.createdAt),
  uniqueIndex("products_public_slug_unique").on(t.publicSlug),
  check("products_price_nonnegative", sql`${t.priceMinor} >= 0`),
  check("products_access_days_positive", sql`${t.accessDays} IS NULL OR ${t.accessDays} > 0`),
  check("products_trial_days_nonnegative", sql`${t.trialDays} >= 0`),
]);

export const digitalFilesTable = pgTable("digital_files", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  kind: fileKindEnum("kind").notNull(),
  storageKey: text("storage_key").notNull(),
  objectPath: text("object_path"),
  filename: text("filename").notNull(),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  status: text("status").notNull().default("pending"),
  position: integer("position").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("digital_files_product_idx").on(t.productId), index("digital_files_product_position_idx").on(t.productId, t.position)]);

export const digitalProductEntitlementsTable = pgTable("digital_product_entitlements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
}, (t) => [
  uniqueIndex("digital_entitlements_user_product_unique").on(t.userId, t.productId),
  index("digital_entitlements_user_idx").on(t.userId),
]);

export const guestDigitalEntitlementsTable = pgTable("guest_digital_entitlements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  acquiredAt: timestamp("acquired_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
}, (t) => [
  uniqueIndex("guest_digital_entitlements_product_email_unique").on(t.productId, t.email),
  index("guest_digital_entitlements_product_idx").on(t.productId),
]);

export const digitalProductPaymentsTable = pgTable("digital_product_payments", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull().default("INR"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  provider: text("provider").notNull().default("zapupi"),
  providerTransactionId: text("provider_transaction_id"),
  providerUtr: text("provider_utr"),
  providerEnvironment: text("provider_environment"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("digital_product_payments_product_idx").on(t.productId),
  index("digital_product_payments_email_idx").on(t.email),
  index("digital_product_payments_status_idx").on(t.status),
  check("digital_product_payments_amount_positive", sql`${t.amountMinor} > 0`),
]);

export const lessonAssetStatusEnum = pgEnum("lesson_asset_status", ["pending", "uploaded", "failed"]);
export const lessonAssetsTable = pgTable("lesson_assets", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  kind: fileKindEnum("kind").notNull().default("video"),
  storageKey: text("storage_key").notNull().unique(),
  objectPath: text("object_path").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  status: lessonAssetStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("lesson_assets_lesson_idx").on(t.lessonId)]);

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  totalMinor: integer("total_minor").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("orders_user_idx").on(t.userId), index("orders_user_created_idx").on(t.userId, t.createdAt), check("orders_total_nonnegative", sql`${t.totalMinor} >= 0`)]);

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id),
  quantity: integer("quantity").notNull().default(1),
  unitPriceMinor: integer("unit_price_minor").notNull(),
}, (t) => [index("order_items_product_order_idx").on(t.productId, t.orderId), check("order_items_quantity_positive", sql`${t.quantity} > 0`), check("order_items_price_nonnegative", sql`${t.unitPriceMinor} >= 0`)]);

export const enrollmentsTable = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
}, (t) => [uniqueIndex("enrollments_user_course_unique").on(t.userId, t.courseId)]);

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  status: paymentStatusEnum("status").notNull().default("pending"),
  amountMinor: integer("amount_minor").notNull(),
  provider: text("provider"),
  providerReference: text("provider_reference"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [check("payments_amount_nonnegative", sql`${t.amountMinor} >= 0`)]);

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  body: text("body"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("reviews_user_course_unique").on(t.userId, t.courseId), check("reviews_rating_range", sql`${t.rating} BETWEEN 1 AND 5`)]);

export const wishlistTable = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("wishlist_user_product_unique").on(t.userId, t.productId)]);

export const couponsTable = pgTable("coupons", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").references(() => usersTable.id),
  code: text("code").notNull(),
  discountPercent: integer("discount_percent"),
  discountMinor: integer("discount_minor"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
}, (t) => [uniqueIndex("coupons_code_unique").on(t.code), check("coupons_percent_range", sql`${t.discountPercent} IS NULL OR ${t.discountPercent} BETWEEN 1 AND 100`)]);

export const liveClassStatusEnum = pgEnum("live_class_status", ["scheduled", "live", "completed", "cancelled"]);
export const recordingStatusEnum = pgEnum("recording_status", ["idle", "recording", "processing", "ready", "failed"]);
export const attendanceRoleEnum = pgEnum("attendance_role", ["host", "student"]);
export const creatorApplicationStatusEnum = pgEnum("creator_application_status", ["pending", "approved", "rejected"]);

export const creatorApplicationsTable = pgTable("creator_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  headline: text("headline").notNull(),
  bio: text("bio").notNull(),
  expertise: text("expertise").notNull(),
  experienceYears: integer("experience_years").notNull().default(0),
  portfolioUrl: text("portfolio_url"),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),
  teachingTopics: text("teaching_topics").array().notNull().default(sql`ARRAY[]::text[]`),
  courseProposal: text("course_proposal").notNull(),
  targetAudience: text("target_audience").notNull(),
  sampleWorkUrl: text("sample_work_url"),
  motivation: text("motivation").notNull(),
  status: creatorApplicationStatusEnum("status").notNull().default("pending"),
  reviewReason: text("review_reason"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("creator_applications_user_unique").on(t.userId),
  index("creator_applications_status_idx").on(t.status),
]);

export const liveClassesTable = pgTable("live_classes", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => usersTable.id),
  courseId: integer("course_id").notNull().references(() => coursesTable.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => productsTable.id, { onDelete: "cascade" }),
  moduleId: integer("module_id").references(() => courseModulesTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  timezone: text("timezone").notNull(),
  status: liveClassStatusEnum("status").notNull().default("scheduled"),
  roomName: text("room_name").notNull().unique(),
  recordingStatus: recordingStatusEnum("recording_status").notNull().default("idle"),
  recordingUrl: text("recording_url"),
  recordingObjectPath: text("recording_object_path"),
  egressId: text("egress_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index("live_classes_product_idx").on(t.productId), index("live_classes_course_start_idx").on(t.courseId, t.startsAt), index("live_classes_module_idx").on(t.moduleId)]);

export const liveClassAttendanceTable = pgTable("live_class_attendance", {
  id: serial("id").primaryKey(),
  liveClassId: integer("live_class_id").notNull().references(() => liveClassesTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  role: attendanceRoleEnum("role").notNull(),
  firstJoinedAt: timestamp("first_joined_at", { withTimezone: true }).notNull().defaultNow(),
  currentJoinedAt: timestamp("current_joined_at", { withTimezone: true }),
  lastLeftAt: timestamp("last_left_at", { withTimezone: true }),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  joinCount: integer("join_count").notNull().default(0),
}, (t) => [uniqueIndex("live_class_attendance_class_user_unique").on(t.liveClassId, t.userId), index("live_class_attendance_class_idx").on(t.liveClassId)]);

export const certificatesTable = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  courseId: integer("course_id").notNull().references(() => coursesTable.id),
  certificateNumber: text("certificate_number").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [uniqueIndex("certificates_number_unique").on(t.certificateNumber), uniqueIndex("certificates_user_course_unique").on(t.userId, t.courseId)]);

export const creatorEarningsTable = pgTable("creator_earnings", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => usersTable.id),
  orderItemId: integer("order_item_id").notNull().references(() => orderItemsTable.id),
  amountMinor: integer("amount_minor").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payoutsTable = pgTable("payouts", {
  id: serial("id").primaryKey(),
  creatorId: integer("creator_id").notNull().references(() => usersTable.id),
  amountMinor: integer("amount_minor").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const platformSettingsTable = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});