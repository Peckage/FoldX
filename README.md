# FoldX

Fold all instances of a function call in the current file.

Right-click any function like `it`, `describe`, or `test` and fold every matching call at once.

Part of the [Peckage](https://marketplace.visualstudio.com/publishers/Peckage) family, alongside [ReferenceX](https://marketplace.visualstudio.com/items?itemName=Peckage.referencex).

## Usage

1. Right-click on a function name in a JS/TS file
2. Select **FoldX: Fold All Instances**
3. Every matching call in the file collapses

To unfold, right-click and select **FoldX: Unfold All**.

Don't have your cursor on a function? Use **FoldX: Fold by Function Name** from the right-click menu or Command Palette to pick from a list of all foldable functions in the file.

## Commands

| Command | Description |
|---|---|
| **FoldX: Fold All Instances** | Fold all calls matching the function at cursor |
| **FoldX: Fold by Function Name** | Pick a function from a list, fold all its calls |
| **FoldX: Unfold All** | Unfold everything in the active editor |

All three commands are available in the right-click context menu and the Command Palette.

## Supported Languages

TypeScript, JavaScript, TSX, JSX.

## Limitations

- Current file only
- The call must have a callback with a block body (arrow function or function expression)
- Relies on VS Code's built-in folding ranges

## License

MIT
