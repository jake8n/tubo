class Editor {
  // initial text
  // dispatch
  // parent element
  // language extension
}

class HTMLEditor {}
class JSEditor {}
class TSEditor {}
class CSSEditor {}

class Application {
  // editors
  // socket
  // frame
}

class Socket {
  // connect
  // disconnect
  // joined
  // active view changed
  // dispatch html
  // dispatch js
  // dispatch css
}

import { Frame } from "./Frame";

const frame = new Frame({ parent: document.createElement("div") });
