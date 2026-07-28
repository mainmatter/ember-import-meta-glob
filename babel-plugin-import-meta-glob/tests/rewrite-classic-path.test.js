import { expect, test } from 'vitest';

import { rewriteClassicPath } from '../index.js';

test('it rewrites classic paths', () => {
  // Usual case in development
  expect(
    rewriteClassicPath(
      '/path/to/awesome-app',
      '/path/to/awesome-app/awesome-app/models/person.js'
    )
  ).toEqual(
      '/path/to/awesome-app/app/models/person.js'
  );
  
  // Nested directories with the same name as can happen in CI (/home/runner/work/reponame/reponame)
  expect(
    rewriteClassicPath(
      '/path/to/awesome-app/awesome-app',
      '/path/to/awesome-app/awesome-app/awesome-app/models/person.js'
    )
  ).toEqual(
      '/path/to/awesome-app/awesome-app/app/models/person.js'
  );

  // App paths containing the app name
  expect(
    rewriteClassicPath(
      '/path/to/awesome-app',
      '/path/to/awesome-app/awesome-app/components/awesome-app/foo.js'
    )
  ).toEqual(
      '/path/to/awesome-app/app/components/awesome-app/foo.js'
  );

  expect(
    rewriteClassicPath(
      '/path/to/awesome-app',
      '/path/to/awesome-app/awesome-app/components/awesome-app/awesome-app/foo.js'
    )
  ).toEqual(
      '/path/to/awesome-app/app/components/awesome-app/awesome-app/foo.js'
  );
});
