import qrcode from "qrcode-generator";

/** SVG markup for a QR code of `text`. Sized by CSS, so cellSize is nominal. */
export function qrSvg(text: string): string {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}
