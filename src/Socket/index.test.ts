import { Socket } from ".";

describe("Socket", () => {
  let socket: Socket;

  beforeEach(() => {
    socket = new Socket();
  });

  test("is alive", () => {
    expect(socket).toBeTruthy();
  });
});
