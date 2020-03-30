import compiler from './testHelpers/compiler';
import getCodeFromStats from './testHelpers/getCodeFromStats';
import getExpectedResult from './testHelpers/getExpectedResult';

test('Shorthand attribute', async () => {
  const stats = await compiler('ShorthandAttribute');

  expect(getCodeFromStats(stats)).toBe(getExpectedResult('ShorthandAttribute'));
});
