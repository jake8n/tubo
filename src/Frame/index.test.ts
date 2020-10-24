import { Frame } from ".";

describe("Frame", () => {
  let parent: Element, frame: Frame;

  beforeEach(() => {
    parent = document.createElement("div");
    frame = new Frame({ js: "", parent });
  });

  test("is alive", () => {
    expect(frame).toBeTruthy();
  });

  describe("constructor", () => {
    test("append iframe to parent", () => {
      expect(frame.parent.firstChild).toBe(frame.iframe);
    });

    test("perform the first render", () => {
      const spy = jest.spyOn(Frame.prototype, "render");
      frame = new Frame({ js: "", parent });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("toHTML", () => {
    test("empty state", () => {
      expect(frame.toHTML()).toMatchSnapshot();
    });

    test("custom inputs", () => {
      frame.js = "const message = 'hello'";
      frame.body = '<div id="#app"></div>';
      frame.css = "body { margin: 0; }";
      expect(frame.toHTML()).toMatchSnapshot();
    });
  });

  describe("render", () => {
    test("apply html to iframe", () => {
      frame.iframe = ({
        contentWindow: {
          document: {
            open: jest.fn(),
            close: jest.fn(),
            write: jest.fn(),
          },
        },
      } as unknown) as HTMLIFrameElement;
      frame.render();
      expect(frame.iframe.contentWindow?.document.open).toHaveBeenCalledTimes(
        1
      );
      expect(frame.iframe.contentWindow?.document.write).toHaveBeenCalledWith(
        frame.toHTML()
      );
      expect(frame.iframe.contentWindow?.document.close).toHaveBeenCalledTimes(
        1
      );
    });

    test("re render when new js is applied", () => {
      const spy = jest.spyOn(frame, "render");
      frame.js = "const message = 'hello'";
      expect(spy).toHaveBeenCalled();
    });

    test("re render when new body is applied", () => {
      const spy = jest.spyOn(frame, "render");
      frame.body = '<div id="#app"></div>';
      expect(spy).toHaveBeenCalled();
    });

    test("re render when new css is applied", () => {
      const spy = jest.spyOn(frame, "render");
      frame.css = "body { margin: 0; }";
      expect(spy).toHaveBeenCalled();
    });
  });
});
