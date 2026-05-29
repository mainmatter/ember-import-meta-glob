import { expect, test } from 'vitest'

let babel = require('@babel/core');
let BabelPluginMetaGlob = require('../babel-plugin-transform-ember-meta-glob.cjs');

test('it transforms import.meta.glob to eager import', () => {
  const statement = `const modules = import.meta.glob('tests/**/*.cjs', { eager: true })`;
  let output = babel.transformSync(statement, {
    plugins: [BabelPluginMetaGlob],
  });
  expect(output.code).toMatchInlineSnapshot(`
    "import * as emberGlob0 from "tests/fixtures/_fixture-b";
    import * as emberGlob1 from "tests/fixtures/_fixture-a";
    const modules = {
      "tests/fixtures/_fixture-b": emberGlob0,
      "tests/fixtures/_fixture-a": emberGlob1
    };"
  `);
})