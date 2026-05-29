import Route from '@ember/routing/route';

export default class ApplicationRoute extends Route {

  async model() {
    const eagerFixtures = import.meta.glob("../mirage/eager-fixtures/*", { eager: true });
    const lazyFixtures = import.meta.glob("../mirage/lazy-fixtures/*");

    const lazyModules = await Promise.all(
      Object.keys(lazyFixtures).map(async (path) => {
        return lazyFixtures[path]();
      })
    );

    return {
      cats: Object.values(eagerFixtures)[1].default.map((item) => item.name).join(', '),
      dogs: Object.values(eagerFixtures)[0].default.map((item) => item.name).join(', '),
      rabbits: Object.values(lazyModules)[1].default.map((item) => item.name).join(', '),
      turtles: Object.values(lazyModules)[0].default.map((item) => item.name).join(', '),
    };
  }
}