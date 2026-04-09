import * as vscode from 'vscode';
import { findFoldableCalls, FoldableCall } from '../core/parser';
import { foldCalls, unfoldCalls } from '../utils/fold';
import { isSupportedLanguage } from '../utils/languages';

// Track which function names are currently folded per document
const foldedState = new Map<string, Set<string>>();

function getDocKey(doc: vscode.TextDocument): string {
  return doc.uri.toString();
}

function buildPreview(calls: FoldableCall[]): string {
  const labels = calls
    .map((c) => c.label)
    .filter((l): l is string => l !== undefined);
  if (labels.length === 0) return '';
  const shown = labels.slice(0, 3);
  const more = labels.length - shown.length;
  let preview = shown.map((l) => `'${l}'`).join(', ');
  if (more > 0) preview += `, +${more} more`;
  return preview;
}

export async function foldByFunctionName(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('FoldX: No active editor.');
    return;
  }

  if (!isSupportedLanguage(editor.document.languageId)) {
    vscode.window.showInformationMessage(
      'FoldX: Not a supported file type (JS/TS/JSX/TSX).',
    );
    return;
  }

  const text = editor.document.getText();
  const allCalls = findFoldableCalls(text);

  if (allCalls.length === 0) {
    vscode.window.showInformationMessage(
      'FoldX: No foldable function calls found in this file.',
    );
    return;
  }

  const docKey = getDocKey(editor.document);
  const currentlyFolded = foldedState.get(docKey) ?? new Set<string>();

  // Group calls by name
  const grouped = new Map<string, FoldableCall[]>();
  for (const call of allCalls) {
    const group = grouped.get(call.name) ?? [];
    group.push(call);
    grouped.set(call.name, group);
  }

  const items: vscode.QuickPickItem[] = [...grouped.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([name, calls]) => {
      const isFolded = currentlyFolded.has(name);
      const preview = buildPreview(calls);
      return {
        label: `${isFolded ? '$(fold-up)' : '$(fold-down)'} ${name}`,
        description: `${calls.length} instance${calls.length === 1 ? '' : 's'}${isFolded ? ' — folded' : ''}`,
        detail: preview || undefined,
      };
    });

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select functions to fold/unfold',
    canPickMany: true,
  });

  if (!selected || selected.length === 0) return;

  let totalFolded = 0;
  let totalUnfolded = 0;

  for (const item of selected) {
    // Strip the codicon prefix to get the real name
    const name = item.label.replace(/^\$\([^)]+\)\s*/, '');
    const calls = grouped.get(name);
    if (!calls) continue;

    if (currentlyFolded.has(name)) {
      await unfoldCalls(editor, calls);
      currentlyFolded.delete(name);
      totalUnfolded += calls.length;
    } else {
      await foldCalls(editor, calls);
      currentlyFolded.add(name);
      totalFolded += calls.length;
    }
  }

  foldedState.set(docKey, currentlyFolded);

  const parts: string[] = [];
  if (totalFolded > 0) parts.push(`folded ${totalFolded}`);
  if (totalUnfolded > 0) parts.push(`unfolded ${totalUnfolded}`);
  vscode.window.setStatusBarMessage(`FoldX: ${parts.join(', ')}`, 3000);
}
