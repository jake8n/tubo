// @ts-ignore
import { close, emit, trigger } from "socket.io-client";
import { Socket } from ".";

describe("Socket", () => {
  let socket: Socket;

  beforeEach(() => {
    socket = new Socket({
      uri: "uri",
      room: "room",
      key: {} as CryptoKey,
    });
  });

  test("is alive", () => {
    expect(socket).toBeTruthy();
  });

  describe("open", () => {
    test("create client", () => {
      socket.open();
      expect(socket.client).toBeTruthy();
    });
  });

  describe("close", () => {
    test("close client", () => {
      socket.open();
      socket.close();
      expect(close).toHaveBeenCalledTimes(1);
    });

    test("error thrown when null", () => {
      expect(() => socket.close()).toThrow("client is null");
    });
  });

  describe("emit", () => {
    test("content is encrypted before sending", async () => {
      socket.open();
      await socket.emit("hello", "message");
      expect(emit).toHaveBeenCalledWith("hello", "#encrypted#");
    });

    test("error thrown when null", () => {
      expect(() => socket.emit("hello", "message")).rejects.toThrow(
        "client is null"
      );
    });
  });

  describe("on", () => {
    test("decrypts message before passing to handler", (done) => {
      expect.assertions(1);
      socket.open();
      socket.on("hello", (content: any) => {
        expect(content.join("\n")).toBe("decoded");
        done();
      });
      trigger("hello", new ArrayBuffer(0));
    });

    test("empty message is not decrypted", (done) => {
      expect.assertions(1);
      socket.open();
      socket.on("hello", (content: any) => {
        expect(content).toBeFalsy();
        done();
      });
      trigger("hello");
    });
  });
});
