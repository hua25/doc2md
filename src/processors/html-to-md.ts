import TurndownService from 'turndown';
import type { ConvertOptions } from '../types/index.js';

// Node 类型定义
type Node = {
  nodeName: string;
  firstChild?: Node | null;
  textContent?: string | null;
  querySelector?: (selector: string) => Element | null;
};

type Element = Node & {
  className: string;
  querySelector: (selector: string) => Element | null;
  querySelectorAll: (selector: string) => NodeListOf<Element>;
};

type NodeListOf<T> = {
  length: number;
  forEach: (callback: (value: T, index: number) => void) => void;
  [index: number]: T;
};

export function createHtmlToMarkdownConverter(options: ConvertOptions = {}) {
  const turndown = new TurndownService({
    headingStyle: options.headingStyle || 'atx',
    codeBlockStyle: options.codeStyle || 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**',
    hr: '---',
  });

  turndown.addRule('table', {
    filter: 'table',
    replacement: (content, node) => {
      return '\n\n' + convertTableToMarkdown(node as Element) + '\n\n';
    },
  });

  turndown.addRule('fencedCodeBlock', {
    filter: (node) => {
      return (
        node.nodeName === 'PRE' &&
        node.firstChild?.nodeName === 'CODE'
      );
    },
    replacement: (content, node) => {
      const codeNode = (node as Element).querySelector?.('code');
      const language = codeNode?.className.replace('language-', '') || '';
      const code = codeNode?.textContent || content;
      return `\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    },
  });

  return turndown;
}

function convertTableToMarkdown(table: Element): string {
  const rows = Array.from(table.querySelectorAll?.('tr') || []);
  if (rows.length === 0) return '';

  const lines: string[] = [];

  rows.forEach((row, index) => {
    const cells = Array.from(row.querySelectorAll?.('td, th') || []);
    const cellContents = cells.map(cell => {
      const text = cell.textContent?.trim() || '';
      return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
    });

    lines.push('| ' + cellContents.join(' | ') + ' |');

    if (index === 0) {
      lines.push('| ' + cells.map(() => '---').join(' | ') + ' |');
    }
  });

  return lines.join('\n');
}

export function cleanMarkdown(markdown: string): string {
  return markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\]\s+\(/g, '](')
    .trim();
}
