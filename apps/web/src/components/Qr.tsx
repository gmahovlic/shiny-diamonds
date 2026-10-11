import { useMemo } from "preact/hooks";
import { qrSvg } from "../qr";

export function Qr(p: { text: string; class?: string }) {
  const svg = useMemo(() => qrSvg(p.text), [p.text]);
  return <div class={`qr ${p.class ?? ""}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}
