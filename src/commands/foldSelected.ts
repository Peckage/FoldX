import * as vscode from 'vscode';
import { findFoldableCalls, resolveCallableNameAtPosition } from '../core/parser';
import { foldCalls } from '../utils/fold';
import { isSupportedLanguage } from '../utils/languages';

export async function foldSelectedFunctionCalls(): Promise<void> {
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
  const offset = editor.document.offsetAt(editor.selection.active);

  const targetName = resolveCallableNameAtPosition(text, offset);
  if (!targetName) {
    vscode.window.showInformationMessage(
      'FoldX: No function call found at cursor position.',
    );
    return;
  }

  const allCalls = findFoldableCalls(text);
  const matching = allCalls.filter((c) => c.name === targetName);

  if (matching.length === 0) {
    vscode.window.showInformationMessage(
      `FoldX: No foldable "${targetName}" calls found.`,
    );
    return;
  }

  const count = await foldCalls(editor, matching);
  vscode.window.setStatusBarMessage(
    `FoldX: Folded ${count} "${targetName}" call(s).`,
    3000,
  );
}
