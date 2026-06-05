import Route from '@ember/routing/route';

export default class ApplicationRoute extends Route {
  async model() {
    const eagerFixtures = import.meta.glob("../mirage/eager-fixtures/*", { eager: true });
    const lazyFixtures = import.meta.glob("../mirage/lazy-fixtures/*");

    // API discrepancy -> .js extension is present in Vite result.
    const lazyModules = {};
    lazyModules['rabbits'] = await lazyFixtures['../mirage/lazy-fixtures/rabbits']();
    lazyModules['turtles'] = await lazyFixtures['../mirage/lazy-fixtures/turtles']();

    return {
      cats: eagerFixtures['../mirage/eager-fixtures/cats'].default.map((item) => item.name).join(', '),
      dogs: eagerFixtures['../mirage/eager-fixtures/dogs'].default.map((item) => item.name).join(', '),
      rabbits: lazyModules['rabbits'].default.map((item) => item.name).join(', '),
      turtles: lazyModules['turtles'].default.map((item) => item.name).join(', '),
    };
  }
}
