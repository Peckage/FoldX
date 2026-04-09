import * as ts from 'typescript';

export interface FoldableCall {
  /** The callable name, e.g. "it", "describe", "test" */
  name: string;
  /** The first string argument if any (e.g. test name) */
  label: string | undefined;
  /** 0-based line number where the call expression starts */
  callStartLine: number;
  /** 0-based line number of the block body opening `{` */
  blockStartLine: number;
  /** 0-based line number of the block body closing `}` */
  blockEndLine: number;
}

function getCallableName(node: ts.CallExpression): string | undefined {
  const expr = node.expression;
  if (ts.isIdentifier(expr)) {
    return expr.text;
  }
  if (ts.isPropertyAccessExpression(expr)) {
    return expr.name.text;
  }
  return undefined;
}

function findCallbackBlock(node: ts.CallExpression): ts.Block | undefined {
  for (const arg of node.arguments) {
    if (
      (ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)) &&
      ts.isBlock(arg.body)
    ) {
      return arg.body;
    }
  }
  return undefined;
}

function getFirstStringArg(node: ts.CallExpression): string | undefined {
  for (const arg of node.arguments) {
    if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
      return arg.text;
    }
    if (ts.isTemplateExpression(arg)) {
      return arg.head.text + '...';
    }
  }
  return undefined;
}

/**
 * Parse the given source text and return all foldable call expressions.
 * A call is foldable if it has a named callee and at least one argument
 * that is a function (arrow or expression) with a multi-line block body.
 */
export function findFoldableCalls(
  sourceText: string,
  fileName: string = 'file.tsx',
): FoldableCall[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const results: FoldableCall[] = [];

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      const name = getCallableName(node);
      if (name) {
        const block = findCallbackBlock(node);
        if (block) {
          const callStartLine = sourceFile.getLineAndCharacterOfPosition(
            node.getStart(sourceFile),
          ).line;
          const blockStartLine = sourceFile.getLineAndCharacterOfPosition(
            block.getStart(sourceFile),
          ).line;
          const blockEndLine = sourceFile.getLineAndCharacterOfPosition(
            block.getEnd(),
          ).line;

          if (blockStartLine < blockEndLine) {
            const label = getFirstStringArg(node);
            results.push({ name, label, callStartLine, blockStartLine, blockEndLine });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return results;
}

/**
 * Given a cursor offset in the source text, find the callable name of the
 * nearest enclosing CallExpression. Returns undefined if the cursor is not
 * inside any call expression.
 */
export function resolveCallableNameAtPosition(
  sourceText: string,
  offset: number,
  fileName: string = 'file.tsx',
): string | undefined {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  function findDeepestNode(node: ts.Node): ts.Node | undefined {
    const start = node.getStart(sourceFile);
    const end = node.getEnd();
    if (offset < start || offset >= end) {
      return undefined;
    }
    let deepest: ts.Node = node;
    ts.forEachChild(node, (child) => {
      const found = findDeepestNode(child);
      if (found) {
        deepest = found;
      }
    });
    return deepest;
  }

  const token = findDeepestNode(sourceFile);
  if (!token) return undefined;

  // Walk up from the deepest token. Collect all enclosing CallExpressions
  // and return the outermost one that has a foldable callback, or the
  // innermost CallExpression if none are foldable. This ensures that
  // clicking inside `it('name', () => { expect(...) })` resolves to `it`
  // rather than `expect`.
  let innermost: string | undefined;
  let outermostFoldable: string | undefined;
  let current: ts.Node | undefined = token;
  while (current) {
    if (ts.isCallExpression(current)) {
      const name = getCallableName(current);
      if (name) {
        if (!innermost) innermost = name;
        if (findCallbackBlock(current)) {
          outermostFoldable = name;
        }
      }
    }
    current = current.parent;
  }

  return outermostFoldable ?? innermost;
}
