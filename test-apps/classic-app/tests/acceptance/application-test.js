import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'classic-app/tests/helpers';

module('Acceptance | application', function (hooks) {
  setupApplicationTest(hooks);

  test('visiting /', async function (assert) {
    await visit('/');

    assert.strictEqual(currentURL(), '/');
    assert.dom('[data-test="eager-cats"]').hasText('Team eager #cats: Midnight, Watari');
    assert.dom('[data-test="eager-dogs"]').hasText('Team eager #dogs: Hero, Pirate');
    assert.dom('[data-test="lazy-rabbits"]').hasText('Team lazy #rabbits: Arthur, Popote');
    assert.dom('[data-test="lazy-turtles"]').hasText('Team lazy #turtles: Caroline, Rocket');
  });
});
