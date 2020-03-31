import compiler from './testHelpers/compiler';
import getCodeFromStats from './testHelpers/getCodeFromStats';
import getExpectedResult from './testHelpers/getExpectedResult';

test('shorthand attribute', async () => {
  const fileName = 'ShorthandAttribute';
  const stats = await compiler(fileName);

  expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
});

test('v-bind attribute', async () => {
  const fileName = 'VBindAttribute';
  const stats = await compiler(fileName);

  expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
});

test('text template', async () => {
  const fileName = 'TextTemplate';
  const stats = await compiler(fileName);

  expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
});

test('left hand side operator', async () => {
  const fileName = 'LeftHandSideOperator';
  const stats = await compiler(fileName);

  expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
});

test('right hand side operator', async () => {
  const fileName = 'RightHandSideOperator';
  const stats = await compiler(fileName);

  expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
});

test('multiple translation in one expression', async () => {
  const fileName = 'Multiple';
  const stats = await compiler(fileName);

  expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
});

test('use object literal as params in frenchkiss', async () => {
  const fileName = 'ObjectLiteralParams';
  const stats = await compiler(fileName);

  expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
});

test('use object with data from vue instance as params in frenchkiss', async () => {
  const fileName = 'ObjectWithVueData';
  const stats = await compiler(fileName);

  expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
});

test('use function call from vue instance as params in frenchkiss', async () => {
  const fileName = 'InstanceFunctionParams';
  const stats = await compiler(fileName);

  expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
});

test('ignore nested translation expression in frenchkiss', async () => {
  const fileName = 'IgnoreNestedTranslation';
  const stats = await compiler(fileName);

  expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
});

test('ignore wrong key type in frenchkiss', async () => {
  const fileName = 'IgnoreWrongType';
  const stats = await compiler(fileName);

  expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
});
