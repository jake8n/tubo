export class Persistence {
  get js(): string {
    return localStorage.getItem("js") || "";
  }

  set js(value: string) {
    localStorage.setItem("js", value);
  }
}
