import { db, categoriesTable, lmsCoursesTable, pool } from "../../lib/db/src/index.ts";

const categories = [
  { name: "Development", slug: "development", description: "Programming and software engineering" },
  { name: "Design", slug: "design", description: "Product and visual design" },
  { name: "Business", slug: "business", description: "Business and entrepreneurship" },
];

await db.insert(categoriesTable).values(categories).onConflictDoNothing({ target: categoriesTable.slug });
await db.insert(lmsCoursesTable).values([
  { title: "Python for Data Science", description: "Practical analysis with Python and pandas.", level: "Intermediate", lessons: 24 },
  { title: "UI/UX Design Principles", description: "Accessible interfaces for real products.", level: "Beginner", lessons: 18 },
]).onConflictDoNothing({ target: lmsCoursesTable.title });
await pool.end();