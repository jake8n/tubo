import debounce from "lodash.debounce";
import React, { Component, h } from "preact";
import { Ref, useRef } from "preact/hooks";

interface Props {
  js: string;
  html: string;
  css: string;
}

export default class Frame extends Component<Props> {
  ref: Ref<HTMLDivElement>;
  useIframeDebounced: Function;

  constructor(props: Props) {
    super(props);
    this.ref = useRef();
    this.useIframeDebounced = debounce(this.useIframe, 200);
  }

  componentDidMount() {
    this.useIframe();
  }

  shouldComponentUpdate(): boolean {
    this.useIframeDebounced();
    return true;
  }

  useIframe() {
    while (this.ref.current.lastChild) {
      this.ref.current.removeChild(this.ref.current.lastChild);
    }
    const iframe = document.createElement("iframe");
    this.ref.current.appendChild(iframe);
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(this.toHTML());
    iframe.contentWindow?.document.close();
  }

  toHTML() {
    return `<head>
  <style>
    ${this.props.css}
  </style>
</head>
<body>
  ${this.props.html}
  <script type="module">
    ${this.props.js}
  </script>
</body>`;
  }

  render() {
    return <div ref={this.ref} />;
  }
}
