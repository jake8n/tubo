import debounce from "lodash.debounce";
import React, { h } from "preact";
import { Ref, useEffect, useRef } from "preact/hooks";

export default function Frame({
  js,
  html,
  css,
}: {
  js: string;
  html: string;
  css: string;
}) {
  const ref: Ref<HTMLDivElement> = useRef();

  // render immediately on mount
  useEffect(() => {
    renderIframe(ref.current, toHTML(js, html, css));
    return () => removeChildren(ref.current);
  }, []);

  // debounce render when contents update
  useEffect(
    (...args: any[]) => {
      renderDebounced(ref.current, toHTML(js, html, css));
    },
    [js, html, css]
  );

  return <div ref={ref} />;
}

const renderIframe = (parent: HTMLElement, content: string) => {
  const iframe = document.createElement("iframe");
  parent.appendChild(iframe);
  iframe.contentWindow?.document.open();
  iframe.contentWindow?.document.write(content);
  iframe.contentWindow?.document.close();
};
const renderDebounced = debounce((parent: HTMLElement, content: string) => {
  removeChildren(parent);
  renderIframe(parent, content);
}, 500);

const removeChildren = (parent: HTMLElement) => {
  while (parent.lastChild) parent.removeChild(parent.lastChild);
};

const toHTML = (js: string, html: string, css: string) => `<head>
  <style>
    ${css}
  </style>
</head>
<body>
  ${html}
  <script type="module">
    ${js}
  </script>
</body>`;
