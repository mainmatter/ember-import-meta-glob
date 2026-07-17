import { expect, test } from 'vitest'

import babel from '@babel/core';
import BabelPluginMetaGlob from '../index.js';

test('it transforms import.meta.glob to lazy import', () => {
  const statement = `const modules = import.meta.glob('tests/**/*.cjs')`;
  let output = babel.transformSync(statement, {
    plugins: [BabelPluginMetaGlob],
  });
  expect(output.code).toMatchInlineSnapshot(`
    "const modules = {
      "tests/fixtures/_fixture-b": () => import("tests/fixtures/_fixture-b"),
      "tests/fixtures/_fixture-a": () => import("tests/fixtures/_fixture-a")
    };"
  `);
})