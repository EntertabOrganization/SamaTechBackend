import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";
import prisma from "../../src/lib/prisma";
import { TEST_USER } from "./testAuth";

jest.mock("../../src/lib/prisma", () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  mockReset(prismaMock);
  // The signed-in test user is an admin unless a test says otherwise.
  prismaMock.user.findUnique.mockResolvedValue({ ...TEST_USER, role: "ADMIN" } as any);
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
