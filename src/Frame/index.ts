import debounce from "lodash.debounce";

interface FrameConfig {
  js: string;
  html: string;
  css: string;
  parent: Element;
}

export class Frame {
  private _js: string;
  private _html: string;
  private _css: string;
  private _renderDebounced: Function;
  parent: Element;

  constructor(config: FrameConfig) {
    this._js = config.js;
    this._html = config.html;
    this._css = config.css;
    this._renderDebounced = debounce(this.render, 200);
    this.parent = config.parent;
    this.render();
  }

  set js(value: string) {
    this._js = value;
    this._renderDebounced();
  }

  set html(value: string) {
    this._html = value;
    this._renderDebounced();
  }

  set css(value: string) {
    this._css = value;
    this._renderDebounced();
  }

  toHTML(): string {
    return `<head>
  <style>
    ${this._css}
  </style>
</head>
<body>
  ${this._html}
  <script type="module">
    ${this._js}
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
