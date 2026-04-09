import * as vscode from 'vscode';
import { foldSelectedFunctionCalls } from './commands/foldSelected';
import { unfoldAll } from './commands/unfoldAll';
import { foldByFunctionName } from './commands/foldByName';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'foldx.foldSelectedFunctionCalls',
      foldSelectedFunctionCalls,
    ),
    vscode.commands.registerCommand('foldx.unfoldAll', unfoldAll),
    vscode.commands.registerCommand(
      'foldx.foldByFunctionName',
      foldByFunctionName,
    ),
  );
}

export function deactivate(): void {}
