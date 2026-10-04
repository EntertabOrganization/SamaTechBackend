import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/utils/prismaMock.ts"],
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
  clearMocks: true,
};

export default config;
