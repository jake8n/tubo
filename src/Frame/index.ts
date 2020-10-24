interface FrameConfig {
  parent: Element;
  js?: string;
  body?: string;
  css?: string;
}

export class Frame {
  #js: string = "";
  #body: string = "";
  #css: string = "";
  parent: Element;
  iframe: HTMLIFrameElement;

  constructor(config: FrameConfig) {
    this.#js = config.js ? config.js : this.#js;
    this.#body = config.body ? config.body : this.#body;
    this.#css = config.css ? config.css : this.#css;
    this.parent = config.parent;
    this.iframe = document.createElement("iframe");
    this.parent.appendChild(this.iframe);
    this.render();
  }

  set js(value: string) {
    this.#js = value;
    this.render();
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
