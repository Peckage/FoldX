import * as vscode from 'vscode';
import { FoldableCall } from '../core/parser';

/**
 * Fold the given calls in the editor using VS Code's built-in fold command.
 * Folds at each call's start line, relying on the language's folding range provider.
 * Returns the number of calls targeted for folding.
 */
export async function foldCalls(
  editor: vscode.TextEditor,
  calls: FoldableCall[],
): Promise<number> {
  if (calls.length === 0) return 0;

  // Save cursor position — editor.fold with selectionLines moves selections
  const savedSelections = editor.selections;

  const lines = calls.map((c) => c.callStartLine);
  await vscode.commands.executeCommand('editor.fold', {
    selectionLines: lines,
  });

  // Restore original cursor position
  editor.selections = savedSelections;

  return calls.length;
}
