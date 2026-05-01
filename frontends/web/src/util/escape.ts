// Ports of escapeHtml / escapeMarkdown from the legacy TabController.js
// (preserved for the mermaid export path).

export function escapeHtml(unsafe: string, gui: boolean): string {
  const res = unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
    .replaceAll('`', '#96;');
  return gui ? res : res.replace('\n', '');
}

export function escapeMarkdown(unsafe: string): string {
  const htmlEscaped = escapeHtml(unsafe, true).replace('\n', '<br>');
  return htmlEscaped
    .replaceAll(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replaceAll(/\*(.*?)\*/g, '<i>$1</i>');
}
