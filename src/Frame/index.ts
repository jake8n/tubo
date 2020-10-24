import debounce from "lodash.debounce";

interface FrameConfig {
  js: string;
  parent: Element;
}

export class Frame {
  #js: string;
  #body: string = '<div id="app"></div>';
  #css: string = "body { font-family: sans-serif; }";
  #renderDebounced: Function;
  parent: Element;
  iframe: HTMLIFrameElement;

  constructor(config: FrameConfig) {
    this.#js = config.js;
    this.#renderDebounced = debounce(this.render, 200);
    this.parent = config.parent;
    this.iframe = document.createElement("iframe");
    this.parent.appendChild(this.iframe);
    this.render();
  }

  set js(value: string) {
    this.#js = value;
    this.#renderDebounced();
  }

  get js() {
    return this.#js;
  }

  set body(value: string) {
    this.#body = value;
    this.#renderDebounced();
  }

  set css(value: string) {
    this.#css = value;
    this.#renderDebounced();
  }

  toHTML(): string {
    return `<head>
  <style>
    ${this.#css}
  </style>
</head>
<body>
  ${this.#body}
  <script type="module">
    ${this.#js}
  </script>
</body>`;
  }

  render() {
    console.debug("Frame:render");
    // TODO: avoid document write
    this.iframe.contentWindow?.document.open();
    this.iframe.contentWindow?.document.write(this.toHTML());
    this.iframe.contentWindow?.document.close();
  }
}
