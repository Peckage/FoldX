import { describe, it, expect } from 'vitest';
import {
  findFoldableCalls,
  resolveCallableNameAtPosition,
} from '../../src/core/parser';

describe('findFoldableCalls', () => {
  it('finds it() with arrow callback', () => {
    const code = [
      "it('works', () => {",
      '  expect(true).toBe(true);',
      '});',
    ].join('\n');
    const calls = findFoldableCalls(code);
    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe('it');
    expect(calls[0].callStartLine).toBe(0);
  });

  it('finds describe() with function expression callback', () => {
    const code = [
      "describe('suite', function () {",
      "  it('a', () => {",
      '    expect(1).toBe(1);',
      '  });',
      '});',
    ].join('\n');
    const calls = findFoldableCalls(code);
    const names = calls.map((c) => c.name);
    expect(names).toContain('describe');
    expect(names).toContain('it');
  });

  it('returns empty for empty file', () => {
    expect(findFoldableCalls('')).toEqual([]);
  });

  it('returns empty when no function calls exist', () => {
    const code = 'const x = 1;\nconst y = 2;\n';
    expect(findFoldableCalls(code)).toEqual([]);
  });

  it('returns empty for calls without callbacks', () => {
    const code = "console.log('hello');\nparseInt('42');\n";
    expect(findFoldableCalls(code)).toEqual([]);
  });

  it('returns empty for arrow callbacks without block body', () => {
    const code = "const result = arr.map(x => x + 1);\n";
    expect(findFoldableCalls(code)).toEqual([]);
  });

  it('returns empty for single-line block callbacks', () => {
    const code = "it('x', () => { expect(1).toBe(1); });\n";
    expect(findFoldableCalls(code)).toEqual([]);
  });

  it('finds multiple calls with the same name', () => {
    const code = [
      "it('a', () => {",
      '  expect(1).toBe(1);',
      '});',
      "it('b', () => {",
      '  expect(2).toBe(2);',
      '});',
      "it('c', () => {",
      '  expect(3).toBe(3);',
      '});',
    ].join('\n');
    const calls = findFoldableCalls(code);
    expect(calls).toHaveLength(3);
    expect(calls.every((c) => c.name === 'it')).toBe(true);
  });

  it('finds calls with different names', () => {
    const code = [
      "describe('suite', () => {",
      "  it('a', () => {",
      '    expect(1).toBe(1);',
      '  });',
      "  test('b', () => {",
      '    expect(2).toBe(2);',
      '  });',
      '});',
    ].join('\n');
    const calls = findFoldableCalls(code);
    const names = calls.map((c) => c.name).sort();
    expect(names).toEqual(['describe', 'it', 'test']);
  });

  it('supports member expression calls like vitest.it()', () => {
    const code = [
      "vitest.it('works', () => {",
      '  expect(true).toBe(true);',
      '});',
    ].join('\n');
    const calls = findFoldableCalls(code);
    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe('it');
  });

  it('handles nested call expressions', () => {
    const code = [
      "describe('outer', () => {",
      "  describe('inner', () => {",
      "    it('deep', () => {",
      '      expect(1).toBe(1);',
      '    });',
      '  });',
      '});',
    ].join('\n');
    const calls = findFoldableCalls(code);
    expect(calls).toHaveLength(3);
    const names = calls.map((c) => c.name);
    expect(names.filter((n) => n === 'describe')).toHaveLength(2);
    expect(names.filter((n) => n === 'it')).toHaveLength(1);
  });

  it('handles multiline call formatting', () => {
    const code = [
      'it(',
      "  'multiline',",
      '  () => {',
      '    expect(true).toBe(true);',
      '  },',
      ');',
    ].join('\n');
    const calls = findFoldableCalls(code);
    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe('it');
    expect(calls[0].callStartLine).toBe(0);
  });

  it('extracts first string argument as label', () => {
    const code = [
      "it('renders correctly', () => {",
      '  expect(true).toBe(true);',
      '});',
    ].join('\n');
    const calls = findFoldableCalls(code);
    expect(calls).toHaveLength(1);
    expect(calls[0].label).toBe('renders correctly');
  });

  it('returns undefined label when no string argument', () => {
    const code = [
      'run(() => {',
      '  doStuff();',
      '});',
    ].join('\n');
    const calls = findFoldableCalls(code);
    expect(calls).toHaveLength(1);
    expect(calls[0].label).toBeUndefined();
  });

  it('folds empty callback blocks spanning multiple lines', () => {
    const code = [
      "it('todo', () => {",
      '});',
    ].join('\n');
    const calls = findFoldableCalls(code);
    expect(calls).toHaveLength(1);
    expect(calls[0].name).toBe('it');
  });
});

describe('resolveCallableNameAtPosition', () => {
  it('resolves name when cursor is on the function identifier', () => {
    const code = "it('works', () => {\n  expect(true).toBe(true);\n});\n";
    // cursor on 'i' of 'it'
    expect(resolveCallableNameAtPosition(code, 0)).toBe('it');
    // cursor on 't' of 'it'
    expect(resolveCallableNameAtPosition(code, 1)).toBe('it');
  });

  it('resolves name when cursor is inside call arguments', () => {
    const code = "it('works', () => {\n  expect(true).toBe(true);\n});\n";
    // cursor on the string 'works'
    const offset = code.indexOf('works');
    expect(resolveCallableNameAtPosition(code, offset)).toBe('it');
  });

  it('resolves outermost foldable call when cursor is inside callback body', () => {
    const code = "it('works', () => {\n  expect(true).toBe(true);\n});\n";
    const offset = code.indexOf('expect');
    // cursor is inside expect(...) which is inside it(...)
    // should resolve to `it` because it's the outermost foldable call
    const name = resolveCallableNameAtPosition(code, offset);
    expect(name).toBe('it');
  });

  it('resolves member expression name', () => {
    const code =
      "vitest.it('works', () => {\n  expect(true).toBe(true);\n});\n";
    // cursor on 'it' in 'vitest.it'
    const offset = code.indexOf('.it') + 1;
    expect(resolveCallableNameAtPosition(code, offset)).toBe('it');
  });

  it('returns undefined when cursor is not in a call', () => {
    const code = 'const x = 1;\nconst y = 2;\n';
    expect(resolveCallableNameAtPosition(code, 0)).toBeUndefined();
  });

  it('returns undefined for empty file', () => {
    expect(resolveCallableNameAtPosition('', 0)).toBeUndefined();
  });

  it('resolves describe from inside describe block', () => {
    const code = [
      "describe('suite', () => {",
      "  it('a', () => {",
      '    expect(1).toBe(1);',
      '  });',
      '});',
    ].join('\n');
    // cursor on 'describe'
    expect(resolveCallableNameAtPosition(code, 0)).toBe('describe');
  });
});
