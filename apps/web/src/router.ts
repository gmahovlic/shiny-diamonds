import { signal } from "@preact/signals";

export type Route =
  | { page: "home" }
  | { page: "player"; code: string }
  | { page: "tv"; code: string };

function parse(pathname: string): Route {
  const m = /^\/(p|tv)\/([A-Za-z]{4})\/?$/.exec(pathname);
  if (m) return { page: m[1] === "tv" ? "tv" : "player", code: (m[2] as string).toUpperCase() };
  return { page: "home" };
}

export const route = signal<Route>(parse(location.pathname));

export function navigate(path: string): void {
  history.pushState(null, "", path);
  route.value = parse(path);
}

window.addEventListener("popstate", () => {
  route.value = parse(location.pathname);
});

export const playerUrl = (code: string) => `${location.origin}/p/${code}`;
export const tvUrl = (code: string) => `${location.origin}/tv/${code}`;
