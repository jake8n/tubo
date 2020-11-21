import React, { h } from "preact";
import { Ref, useEffect, useRef } from "preact/hooks";

export default function ({
  js,
  html,
  css,
}: {
  js: string;
  html: string;
  css: string;
}) {
  const ref: Ref<HTMLDivElement> = useRef();
  // TODO: debounce
  useEffect(() => {
    const iframe = document.createElement("iframe");
    ref.current.appendChild(iframe);
    iframe.contentWindow?.document.open();
    iframe.contentWindow?.document.write(toHTML(js, html, css));
    iframe.contentWindow?.document.close();

    return () => {
      while (ref.current.lastChild) {
        ref.current.removeChild(ref.current.lastChild);
      }
    };
  });

  return <div ref={ref} />;
}

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
