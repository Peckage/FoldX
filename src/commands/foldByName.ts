import * as vscode from 'vscode';
import { findFoldableCalls } from '../core/parser';
import { foldCalls } from '../utils/fold';
import { isSupportedLanguage } from '../utils/languages';

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

  const countMap = new Map<string, number>();
  for (const call of allCalls) {
    countMap.set(call.name, (countMap.get(call.name) ?? 0) + 1);
  }

  const items: vscode.QuickPickItem[] = [...countMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      label: name,
      description: `${count} instance${count === 1 ? '' : 's'}`,
    }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a function to fold all instances',
  });

  if (!selected) return;

  const matching = allCalls.filter((c) => c.name === selected.label);
  const count = await foldCalls(editor, matching);
  vscode.window.setStatusBarMessage(
    `FoldX: Folded ${count} "${selected.label}" call(s).`,
    3000,
  );
}
