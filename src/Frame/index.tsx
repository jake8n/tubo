import debounce from "lodash.debounce";
import React, { h } from "preact";
import { Ref, useEffect, useRef } from "preact/hooks";
import { File } from "../Persistence";

export default function Frame({ files }: { files: File[] }) {
  const ref: Ref<HTMLDivElement> = useRef();

  // render immediately on mount
  useEffect(() => {
    const html = files.find((file) => file.path === "index.html")?.doc;
    const js = files.find((file) => file.path === "script.js")?.doc;
    const css = files.find((file) => file.path === "main.css")?.doc;
    renderIframe(ref.current, toHTML(html, js, css));
    return () => removeChildren(ref.current);
  }, []);

  // debounce render when contents update
  useEffect(() => {
    const html = files.find((file) => file.path === "index.html")?.doc;
    const js = files.find((file) => file.path === "script.js")?.doc;
    const css = files.find((file) => file.path === "main.css")?.doc;
    renderDebounced(ref.current, toHTML(html, js, css));
  }, [files]);

  return <div ref={ref} class="h-full" />;
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

const toHTML = (
  html: string | undefined,
  js: string | undefined,
  css: string | undefined
) => `<head>
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
