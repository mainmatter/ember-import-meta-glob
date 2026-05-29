async function getDefaultExports(modules) {
  return Promise.all(
    Object.entries(modules).map(([path, importFn]) =>
      importFn().then((module) => ({ path, defaultExport: module.default })),
    ),
  );
}

function entityName(path) {
  return path.split('/').pop().split('.')[0];
}

export async function createConfig(mirageImportMap = {}) {
  return {
    fixtures: await importEntities(mirageImportMap.fixtures),
  };
}

async function importEntities(importMap = {}) {
  const modules = await getDefaultExports(importMap);
  return modules.reduce((acc, { path, defaultExport }) => {
    const configName = entityName(path);
    acc[configName] = defaultExport;
    return acc;
  }, {});
}
