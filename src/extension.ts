import * as vscode from 'vscode';
import { unfoldAll } from './commands/unfoldAll';
import { foldByFunctionName } from './commands/foldByName';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'foldx.foldByFunctionName',
      foldByFunctionName,
    ),
    vscode.commands.registerCommand('foldx.unfoldAll', unfoldAll),
  );
}

export function deactivate(): void {}
