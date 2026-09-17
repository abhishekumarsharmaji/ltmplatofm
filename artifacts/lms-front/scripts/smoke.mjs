const origin = process.env.SMOKE_ORIGIN ?? "http://localhost:80";

const publicPaths = [
  "/",
  "/courses",
  "/courses/1",
  "/products",
  "/checkout",
  "/platform/tenants",
  "/auth/login",
];

for (const path of publicPaths) {
  const response = await fetch(`${origin}${path}`);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
}

const coursesResponse = await fetch(`${origin}/api/courses`);
const courses = await coursesResponse.json();
if (!Array.isArray(courses) || courses.length === 0) {
  throw new Error("course catalog is empty");
}

console.log(`Smoke test passed: ${publicPaths.length} public routes and the catalog API`);