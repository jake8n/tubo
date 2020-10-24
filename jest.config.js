module.exports = {
  collectCoverageFrom: ["<rootDir>/src/**/*.ts"],
  setupFiles: ["<rootDir>/jest.setup.ts"],
  transform: {
    ".*\\.ts$": "ts-jest",
  },
};
