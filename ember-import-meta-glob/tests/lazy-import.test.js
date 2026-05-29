import { expect, test } from 'vitest'

let babel = require('@babel/core');
let BabelPluginMetaGlob = require('../babel-plugin-transform-ember-meta-glob.cjs');

test('it transforms import.meta.glob to lazy import', () => {
  const statement = `const modules = import.meta.glob('tests/**/*.cjs')`;
  let output = babel.transformSync(statement, {
    plugins: [BabelPluginMetaGlob],
  });
  expect(output.code).toMatchInlineSnapshot(`
    "const modules = {
      "tests/fixtures/_fixture-b": () => require("tests/fixtures/_fixture-b"),
      "tests/fixtures/_fixture-a": () => require("tests/fixtures/_fixture-a")
    };"
  `);
})