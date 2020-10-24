interface FrameConfig {
  js: string;
  parent: Element;
}

export class Frame {
  #js: string;
  #body: string = '<div id="app"></div>';
  #css: string = "body { font-family: sans-serif; }";
  parent: Element;
  iframe: HTMLIFrameElement;

  constructor(config: FrameConfig) {
    this.#js = config.js;
    this.parent = config.parent;
    this.iframe = document.createElement("iframe");
    this.parent.appendChild(this.iframe);
    this.render();
  }

  set js(value: string) {
    this.#js = value;
    this.render();
  }

  get js() {
    return this.#js;
  }

  set body(value: string) {
    this.#body = value;
    this.render();
  }

  set css(value: string) {
    this.#css = value;
    this.render();
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
    // TODO: avoid document write
    this.iframe.contentWindow?.document.open();
    this.iframe.contentWindow?.document.write(this.toHTML());
    this.iframe.contentWindow?.document.close();
  }
}
