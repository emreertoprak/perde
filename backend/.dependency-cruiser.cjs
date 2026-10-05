/* global module */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-is-pure',
      severity: 'error',
      from: { path: 'src/modules/[^/]+/domain' },
      to: { path: '(express|drizzle|redis|bullmq|src/.*/infrastructure)' },
    },
    {
      name: 'application-has-no-http-or-persistence',
      severity: 'error',
      from: { path: 'src/modules/[^/]+/application' },
      to: {
        path: '(express|drizzle|src/modules/[^/]+/presentation|src/modules/[^/]+/infrastructure)',
      },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'types', 'node'],
    },
  },
};
