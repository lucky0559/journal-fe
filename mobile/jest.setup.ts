// Native modules are mocked per test file; this file only holds global test setup.
jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
