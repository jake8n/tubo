export class Persistence {
  get js(): string {
    return localStorage.getItem("js") || "";
  }

  set js(value: string) {
    localStorage.setItem("js", value);
  }

  get html(): string {
    return localStorage.getItem("html") || "";
  }

  set html(value: string) {
    localStorage.setItem("html", value);
  }

  get css(): string {
    return localStorage.getItem("css") || "";
  }

  set css(value: string) {
    localStorage.setItem("css", value);
  }
}
