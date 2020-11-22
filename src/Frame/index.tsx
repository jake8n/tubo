import debounce from "lodash.debounce";
import React, { h } from "preact";
import { Ref, useEffect, useRef, useState } from "preact/hooks";
import { File } from "../Persistence";
// @ts-ignore
import { init, parse } from "es-module-lexer";

export default function Frame({ files }: { files: File[] }) {
  const ref: Ref<HTMLDivElement> = useRef();
  const isInitialMount = useRef(true);

  // render immediately on mount
  useEffect(() => {
    init.then(() => renderIframe(ref.current, files));
    return removeChildren(ref.current);
  }, []);

  // debounce render when contents update
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      renderDebounced(ref.current, files);
    }
  }, [files]);

  return <div ref={ref} class="h-full" />;
}

const getContent = (files: File[]): string => {
  const html = files.find((file) => file.path === "index.html")?.doc;
  const css = files.find((file) => file.path === "main.css")?.doc;

  const scripts = files.filter((file) => file.lang === "javascript");
  const entry = scripts.find((script) => script.path === "entry.js")?.doc;

  if (!entry) throw new Error("could not find entry script");

  try {
    return toHTML(html, resolveRelativeImports(entry, scripts), css);
  } catch (err) {
    // suppress error to keep console clean
    return toHTML(html, entry, css);
  }
};

// TODO: detect and error on circular dependency
const resolveRelativeImports = (entry: string, files: File[]): string => {
  let [imports] = parse(entry);
  if (!imports.length) return entry;

  for (let i = 0; i < imports.length; i++) {
    const { s, e } = imports[i];
    const path = entry.substring(s, e);
    const isRelativeImport = path.startsWith(".");
    if (isRelativeImport) {
      const pathWithExtension = path.endsWith(".js") ? path : path + ".js";
      const relativeImportScript = files.find(
        (file) => file.path === pathWithExtension.slice(2)
      );
      if (!relativeImportScript)
        throw new Error(`could not find import ${path}`);
      const relativeImportScriptURI = `data:text/javascript;base64,${btoa(
        resolveRelativeImports(relativeImportScript.doc, files)
      )}`;
      entry =
        entry.substring(0, s) + relativeImportScriptURI + entry.substring(e);
      // import positions will have shifted so parse again
      [imports] = parse(entry);
    }
  }

  return entry;
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
