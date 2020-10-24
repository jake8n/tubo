import { KeyManager } from ".";

describe("KeyManager", () => {
  let keyManager: KeyManager;

  beforeEach(() => {
    global.crypto = {
      // @ts-ignore
      subtle: {
        exportKey: jest.fn().mockResolvedValue({ k: "key" }),
        generateKey: jest.fn().mockResolvedValue({}),
        importKey: jest.fn().mockResolvedValue({}),
      },
    };
    keyManager = new KeyManager();
  });

  test("is alive", () => {
    expect(keyManager).toBeTruthy();
  });

  describe("generate", () => {
    test("create new key", async () => {
      await keyManager.generate();
      expect(keyManager.key).toBeDefined();
    });
  });

  describe("export", () => {
    test("export key when it is defined", async () => {
      await keyManager.generate();
      expect(await keyManager.export()).toEqual("key");
    });

    test("throw error if key is undefined", () => {
      expect(() => keyManager.export()).rejects.toThrow("key is undefined");
    });
  });

  describe("import", () => {
    test("generate an existing key from an input string", async () => {
      await keyManager.import("key");
      expect(keyManager.key).toBeDefined();
    });
  });
});
