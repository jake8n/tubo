import debounce from "lodash.debounce";

interface FrameConfig {
  js: string;
  html: string;
  css: string;
  parent: Element;
}

export class Frame {
  #js: string;
  #html: string;
  #css: string;
  #renderDebounced: Function;
  parent: Element;

  constructor(config: FrameConfig) {
    this.#js = config.js;
    this.#html = config.html;
    this.#css = config.css;
    this.#renderDebounced = debounce(this.render, 200);
    this.parent = config.parent;
    this.render();
  }

  set js(value: string) {
    this.#js = value;
    this.#renderDebounced();
  }

  get js() {
    return this.#js;
  }

  set html(value: string) {
    this.#html = value;
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
  ${this.#html}
  <script type="module">
    ${this.#js}
  </script>
</body>`;
  }

  render() {
    console.debug("Frame:render");
    // TODO: avoid document write
    while (this.parent.lastChild) {
      this.parent.removeChild(this.parent.lastChild);
    }
    // create new iframe each time to reset registered elements
    const iframe = document.createElement("iframe");
    this.parent.appendChild(iframe);
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(this.toHTML());
    iframe.contentWindow?.document.close();
  }
}
