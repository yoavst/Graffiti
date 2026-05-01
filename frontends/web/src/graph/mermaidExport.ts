// Mermaid serializer — only used for the "Share -> Mermaid" feature.
// Keeps output compatible with the legacy export format so users sharing
// graphs with old links still produces the same diagram.

import {
  COMMENT_THEME,
  MARKDOWN_THEME,
  THEMES,
  type ArrowKind,
  type GraphDoc,
} from './model';
import { escapeHtml, escapeMarkdown } from '@/util/escape';

const ARROWS: Record<ArrowKind, string> = {
  normal: '-->',
  dotted: '-.->',
  cross: '--x',
  // Plain line — no arrowhead. Mermaid's `---` keeps the link without arrows.
  none: '---',
};

export interface MermaidOptions {
  gui?: boolean;          // true = renderable in Mermaid live editor
  elkRenderer?: boolean;  // true = use flowchart-elk
  darkMode?: boolean;
}

export function toMermaid(doc: GraphDoc, opts: MermaidOptions = {}): string {
  const gui = opts.gui ?? false;
  const elk = opts.elkRenderer ?? false;
  const dark = opts.darkMode ?? false;

  if (doc.nodes.length === 0) return '';

  let s = gui ? (elk ? 'flowchart-elk TD\n' : 'flowchart TD\n') : 'graph TD\n';

  s = `---
config:
    theme: ${dark ? 'dark' : 'default'}
    themeVariables:
        lineColor: '#c0c0c0'
    flowchart:
      ${gui ? 'padding: 5' : ''}
---
` + s;

  const themeBuckets: string[][] = THEMES.map(() => []);
  const defaultMarkdownTheme: string[] = [];
  const defaultCommentTheme: string[] = [];
  const lineNodes: string[] = [];
  const commentNodes = new Set<number>();

  for (const node of doc.nodes) {
    const nodeName = `N${node.id}`;
    const label = node.overrideLabel ?? node.label;
    if (node.extra.isMarkdown) {
      if (gui) {
        if (node.extra.isComment) {
          s += `  ${nodeName}{{"\`${escapeHtml(label, gui)}\`"}}\n`;
        } else {
          s += `  ${nodeName}(["\`${escapeHtml(label, gui)}\`"])\n`;
        }
      } else {
        // Older mermaid: no inline markdown
        s += `${nodeName}("${escapeMarkdown(label)}")\n`;
      }

      if (node.extra.isComment) {
        commentNodes.add(node.id);
        if (node.theme === undefined || node.theme === 4) defaultCommentTheme.push(nodeName);
        else themeBuckets[node.theme]!.push(nodeName);
      } else {
        if (node.theme === undefined) defaultMarkdownTheme.push(nodeName);
        else themeBuckets[node.theme]!.push(nodeName);
      }
    } else {
      s += `  ${nodeName}["${escapeHtml(label, gui)}"]\n`;
      themeBuckets[node.theme ?? 0]!.push(nodeName);
      if (node.extra.line !== undefined) lineNodes.push(nodeName);
    }
  }

  s += '\n\n';
  for (const edge of doc.edges) {
    const arrow = ARROWS[edge.arrow ?? 'normal'];
    if (commentNodes.has(edge.to) || commentNodes.has(edge.from)) {
      s += `N${edge.from} --- N${edge.to}\n`;
    } else if (edge.label !== undefined) {
      s += `N${edge.from}${arrow}|"${escapeHtml(edge.label, gui)}"|N${edge.to}\n`;
    } else {
      s += `N${edge.from} ${arrow} N${edge.to}\n`;
    }
  }

  s += '\n\n';
  const stroke = dark ? 'white' : 'black';
  for (let i = 0; i < THEMES.length; i++) {
    const bucket = themeBuckets[i]!;
    if (bucket.length === 0) continue;
    const theme = THEMES[i]!;
    s += `classDef theme${i} fill:${theme.bg},color:${theme.fg},stroke:${stroke},stroke-width:2px\n`;
    s += `class ${bucket.join(',')} theme${i}\n`;
  }
  if (defaultMarkdownTheme.length) {
    s += `classDef markdownDefaultTheme fill:${MARKDOWN_THEME.bg},color:${MARKDOWN_THEME.fg},stroke:black,stroke-width:2px\n`;
    s += `class ${defaultMarkdownTheme.join(',')} markdownDefaultTheme\n`;
  }
  if (defaultCommentTheme.length) {
    s += `classDef comment fill:${COMMENT_THEME.bg},color:${COMMENT_THEME.fg},stroke:${stroke},stroke-width:2px\n`;
    s += `class ${defaultCommentTheme.join(',')} comment\n`;
  }
  if (lineNodes.length) {
    s += `classDef lineNode stroke-dasharray: 5 5\n`;
    s += `class ${lineNodes.join(',')} lineNode\n`;
  }

  return s;
}
