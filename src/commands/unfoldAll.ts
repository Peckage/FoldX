import * as vscode from 'vscode';

export async function unfoldAll(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('FoldX: No active editor.');
    return;
  }

  await vscode.commands.executeCommand('editor.unfoldAll');
}
