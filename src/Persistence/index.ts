export class Persistence {
  get js(): string {
    return (
      localStorage.getItem("js") ||
      `// script.js
console.log('hello from iframe')`
    );
  }

  set js(value: string) {
    localStorage.setItem("js", value);
  }

  get html(): string {
    return localStorage.getItem("html") || "<!-- index.html -->";
  }

  set html(value: string) {
    localStorage.setItem("html", value);
  }

  get css(): string {
    return localStorage.getItem("css") || "/* main.css */";
  }

  set css(value: string) {
    localStorage.setItem("css", value);
  }
}
