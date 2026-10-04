import jwt from "jsonwebtoken";

export interface TestAdmin {
  id: string;
  email: string;
}

export const TEST_ADMIN: TestAdmin = {
  id: "11111111-1111-1111-1111-111111111111",
  email: "admin@example.com",
};

/**
 * Signs a JWT with the same secret the app uses in the test environment
 * (see jest.setup.ts) and returns a `Cookie` header string that can be
 * passed to supertest's `.set('Cookie', ...)`.
 */
export const authCookie = (admin: TestAdmin = TEST_ADMIN): string => {
  const token = jwt.sign(admin, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
  return `token=${token}`;
};
