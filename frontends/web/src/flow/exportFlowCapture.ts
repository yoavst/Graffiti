import { toBlob, toSvg } from 'html-to-image';

const CSS_REF_DPI = 96;

/** Map export DPI to html-to-image pixel ratio (CSS pixel grid ≈ 96 DPI). */
export function exportDpiToPixelRatio(dpi: number): number {
  return Math.max(1, dpi / CSS_REF_DPI);
}

// Matches `theme.palette.background.paper` / app shell (see src/ui/theme.ts).
const EXPORT_SURFACE_BG = '#2b2d31';

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function safeExportBasename(name: string | undefined): string {
  const trimmed = (name ?? 'graph').trim() || 'graph';
  return trimmed.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 120) || 'graph';
}

export async function captureViewportToJpegBlob(el: HTMLElement, dpi: number): Promise<Blob> {
  const pixelRatio = exportDpiToPixelRatio(dpi);
  const blob = await toBlob(el, {
    type: 'image/jpeg',
    quality: 0.92,
    pixelRatio,
    backgroundColor: EXPORT_SURFACE_BG,
    cacheBust: true,
  });
  if (!blob) throw new Error('JPEG export failed');
  return blob;
}

/** `toSvg` returns a data URL; turn it into a file blob via the browser (same bytes, no manual decode). */
export async function captureViewportToSvgFile(el: HTMLElement, dpi: number, filename: string) {
  const pixelRatio = exportDpiToPixelRatio(dpi);
  const dataUrl = await toSvg(el, {
    pixelRatio,
    backgroundColor: EXPORT_SURFACE_BG,
    cacheBust: true,
  });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  downloadBlob(filename.endsWith('.svg') ? filename : `${filename}.svg`, blob);
}

export function downloadJpeg(filename: string, blob: Blob) {
  downloadBlob(filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? filename : `${filename}.jpg`, blob);
}
