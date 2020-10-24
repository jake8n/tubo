import { Transaction } from "@codemirror/next/state";
import { View } from ".";
import { Frame } from "../Frame";
import { Socket } from "../Socket";

describe("View", () => {
  let view: View, frame: Frame, socket: Socket;

  beforeEach(() => {
    frame = new Frame({
      parent: document.createElement("div"),
    });
    socket = new Socket({
      uri: "uri",
      room: "room",
      key: {} as CryptoKey,
    });
    view = new View({
      doc: "doc",
      frame,
      socket,
      parent: document.createElement("div"),
    });
    socket.open();
  });

  test("is alive", () => {
    expect(view).toBeTruthy();
  });

  describe("constructor", () => {
    test("create an editor", () => {
      expect(view.view).toBeTruthy();
    });
  });

  describe("onDispatch", () => {
    let transaction: Transaction;

    beforeEach(() => {
      // @ts-ignore
      transaction = {
        annotation: () => false,
        changes: {
          empty: false,
          toJSON: (): number[] => [],
        },
      } as Transaction;
    });

    test("update state with latest transaction", () => {
      const spy = jest.spyOn(view.view, "update");
      view.onDispatch(transaction);
      expect(spy).toHaveBeenCalledWith([transaction]);
    });

    test("sets js on frame when there are changes", () => {
      const spy = jest.spyOn(frame, "js", "set");
      view.onDispatch(transaction);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    test("sets js on frame when there are changes", () => {
      const spy = jest.spyOn(frame, "js", "set");
      (transaction.changes.empty as any) = true;
      view.onDispatch(transaction);
      expect(spy).not.toHaveBeenCalled();
    });

    test("sends update and sync event when there are changes", () => {
      const spy = jest.spyOn(socket, "emit");
      view.onDispatch(transaction);
      expect(spy).toHaveBeenCalledWith(
        "update",
        JSON.stringify(transaction.changes.toJSON())
      );
      expect(spy).toHaveBeenCalledWith(
        "sync",
        JSON.stringify(view.view.state.doc)
      );
    });
  });
});
