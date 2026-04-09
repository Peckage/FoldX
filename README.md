# FoldX

**Fold matching function calls in the current file.**

Place your cursor on any function name — like `it`, `describe`, or `test` — run a command, and FoldX folds every matching call in the file. Ideal for navigating large test files with many repeated blocks.

FoldX is the sibling extension of [ReferenceX](https://marketplace.visualstudio.com/items?itemName=your-publisher-id.referencex).

---

## Features

- **Fold by cursor** — click on a function name, run the command, all matching calls collapse
- **Fold by picker** — open a Quick Pick listing every foldable function in the file (with counts), choose one to fold
- **Unfold all** — quickly restore all folded regions
- AST-based detection using the TypeScript compiler API (no regex hacks)
- Supports arrow functions and function expressions with block bodies

## Example

```ts
// Place cursor on "it", run FoldX: Fold Selected Function Calls
// All it(...) blocks in the file collapse:

describe('math', () => {
  it('adds', () => { …
  it('subtracts', () => { …
  it('multiplies', () => { …
});
```

## Commands

| Command | ID | Description |
|---|---|---|
| **FoldX: Fold Selected Function Calls** | `foldx.foldSelectedFunctionCalls` | Fold all calls matching the function name at the cursor |
| **FoldX: Unfold All** | `foldx.unfoldAll` | Unfold all folded regions in the active editor |
| **FoldX: Fold by Function Name** | `foldx.foldByFunctionName` | Pick a function name from a list and fold all its calls |

## Supported languages

- TypeScript (`.ts`)
- TypeScript React (`.tsx`)
- JavaScript (`.js`)
- JavaScript React (`.jsx`)

## Supported call patterns

- Direct calls: `it(...)`, `describe(...)`, `test(...)`, and any other function call with a callback block
- Member expression calls: `vitest.it(...)`, `foo.describe(...)`

The call must contain at least one argument that is an arrow function or function expression with a multi-line block body.

## Limitations (v1)

- Current file only — no workspace-wide folding
- Relies on VS Code's built-in folding ranges provided by the TypeScript language service. If the language service doesn't recognize a range as foldable, FoldX cannot fold it.
- `test.each(...)('name', ...)` and similar chained call patterns are not yet supported
- Expression-body arrow callbacks (e.g. `arr.map(x => x + 1)`) are intentionally skipped since there is nothing to fold

## How it works

FoldX parses the active file with the TypeScript compiler API to find all `CallExpression` nodes. For each call with a named callee and a callback argument containing a block body, it records the foldable range. It then drives VS Code's built-in `editor.fold` command with the target line numbers.

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
pnpm install
```

### Build

```bash
pnpm build
```

### Run in VS Code

1. Open this folder in VS Code
2. Press `F5` to launch the Extension Development Host
3. Open a `.ts` or `.js` file with test blocks
4. Run commands from the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)

### Run tests

```bash
pnpm test
```

### Package

```bash
pnpm package
```

This produces a `.vsix` file you can install locally or publish to the marketplace.

## Publishing

```bash
npx vsce publish
```

Requires a Personal Access Token configured for the VS Code Marketplace. See the [publishing guide](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

## License

MIT
