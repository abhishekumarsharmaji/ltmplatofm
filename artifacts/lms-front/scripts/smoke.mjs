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

const email = `smoke-${Date.now()}@example.com`;
const registrationResponse = await fetch(`${origin}/api/auth/sign-up`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    name: "Smoke Test",
    email,
    password: "smoke-test-password",
  }),
});

if (!registrationResponse.ok) throw new Error(`registration returned ${registrationResponse.status}`);
const cookie = registrationResponse.headers.get("set-cookie")?.split(";")[0];
if (!cookie) throw new Error("registration did not set a session cookie");

const sessionResponse = await fetch(`${origin}/api/auth/session`, {
  headers: { cookie },
});
const session = await sessionResponse.json();
if (!session.authenticated || session.user?.role !== "student") {
  throw new Error("authenticated session was not restored");
}

const coursesResponse = await fetch(`${origin}/api/courses`);
const courses = await coursesResponse.json();
if (!Array.isArray(courses) || courses.length === 0) {
  throw new Error("course catalog is empty");
}

const loginResponse = await fetch(`${origin}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password: "smoke-test-password" }),
});
if (!loginResponse.ok) throw new Error(`login returned ${loginResponse.status}`);

console.log(`Smoke test passed: ${publicPaths.length} routes, registration/login session, and course catalog`);