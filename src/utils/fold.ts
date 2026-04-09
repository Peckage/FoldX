import * as vscode from 'vscode';
import { FoldableCall } from '../core/parser';

/**
 * Fold the given calls in the editor by placing multi-cursors at each
 * call's start line and running editor.fold. This is more reliable than
 * using selectionLines, which can silently fail in some configurations.
 */
export async function foldCalls(
  editor: vscode.TextEditor,
  calls: FoldableCall[],
): Promise<number> {
  if (calls.length === 0) return 0;

  const savedSelections = editor.selections;

  // Place a cursor at the start of each call line
  editor.selections = calls.map(
    (c) =>
      new vscode.Selection(c.callStartLine, 0, c.callStartLine, 0),
  );

  await vscode.commands.executeCommand('editor.fold');

  // Restore original cursor position
  editor.selections = savedSelections;

  return calls.length;
}
