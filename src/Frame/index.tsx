import debounce from "lodash.debounce";
import React, { h } from "preact";
import { Ref, useEffect, useRef, useState } from "preact/hooks";
import { File } from "../Persistence";
// @ts-ignore
import { init, parse } from "es-module-lexer";

export default function Frame({ files }: { files: File[] }) {
  const ref: Ref<HTMLDivElement> = useRef();

  // render immediately on mount
  useEffect(() => {
    init.then(() => renderIframe(ref.current, files));
    return removeChildren(ref.current);
  }, []);

  // debounce render when contents update
  useEffect(() => {
    renderDebounced(ref.current, files);
  }, [files]);

  return <div ref={ref} class="h-full" />;
}

const getContent = (files: File[]): string => {
  const html = files.find((file) => file.path === "index.html")?.doc;
  const css = files.find((file) => file.path === "main.css")?.doc;

  const scripts = files.filter((file) => file.lang === "javascript");
  const entry = scripts.find((script) => script.path === "entry.js")?.doc;

  try {
    // TODO: resolve all imports in entry file (not children for now)
    // TODO: ignore non-relative imports (regex)
    const [imports] = parse(entry);
    if (imports.length !== 1)
      throw new Error("only 1 import from entry file is supported");
    const { s: start, e: end } = imports[0];
    const path = entry?.substring(start, end).slice(2);
    const targetScript = scripts.find((script) => script.path === path);
    if (!targetScript) throw new Error(`${path} could not be found`);
    const targetScriptResolved = `data:text/javascript;base64,${btoa(
      targetScript.doc
    )}`;
    const nextEntry =
      entry?.substring(0, start) + targetScriptResolved + entry?.substring(end);
    return toHTML(html, nextEntry, css);
  } catch (err) {
    console.error(err);
  }

  return toHTML(html, entry, css);
};

const renderIframe = (parent: HTMLElement, files: File[]) => {
  const content = getContent(files);
  const iframe = document.createElement("iframe");
  parent.appendChild(iframe);
  iframe.contentWindow?.document.open();
  iframe.contentWindow?.document.write(content);
  iframe.contentWindow?.document.close();
};
const renderDebounced = debounce((parent: HTMLElement, files: File[]) => {
  removeChildren(parent);
  renderIframe(parent, files);
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
