import compiler from './testHelpers/compiler';
import getCodeFromStats from './testHelpers/getCodeFromStats';
import getExpectedResult from './testHelpers/getExpectedResult';
import frenchkiss from 'frenchkiss';
import { FluentBundle, FluentResource } from '@fluent/bundle';
import fluentTranslator from '../src/translators/fluent-translator';

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

test('skip script', async () => {
  const fileName = 'SkipScript';
  const stats = await compiler(fileName);

  expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
});

test('skip style', async () => {
  const fileName = 'SkipStyle';
  const stats = await compiler(fileName);

  expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
});

test('optimize spaces', async () => {
  const fileName = 'SpaceOptimize';
  const stats = await compiler(fileName);

  expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
});

test('multiple sequential text template', async () => {
  const fileName = 'MultipleTextTemplate';
  const stats = await compiler(fileName);

  expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
});

describe('frenchkiss', () => {
  test('use object literal as params in frenchkiss', async () => {
    const fileName = 'frenchkiss/ObjectLiteralParams';
    const stats = await compiler(fileName);

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('use object with data from vue instance as params in frenchkiss', async () => {
    const fileName = 'frenchkiss/ObjectWithVueData';
    const stats = await compiler(fileName);

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('use function call from vue instance as params in frenchkiss', async () => {
    const fileName = 'frenchkiss/InstanceFunctionParams';
    const stats = await compiler(fileName);

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('skip nested translation expression in frenchkiss', async () => {
    const fileName = 'frenchkiss/SkipNestedTranslation';
    const stats = await compiler(fileName);

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('skip incorrect key type in frenchkiss', async () => {
    const fileName = 'frenchkiss/SkipIncorrectKeyType';
    const stats = await compiler(fileName);

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });
  test('translate missing key in frenchkiss', async () => {
    const fileName = 'frenchkiss/MissingKey';
    const stats = await compiler(fileName);

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('skip missing key in frenchkiss', async () => {
    frenchkiss.onMissingKey(() => {
      throw new Error();
    });
    const fileName = 'frenchkiss/SkipMissingKey';
    const stats = await compiler(fileName);

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });
});

describe('fluent', () => {
  const resource = new FluentResource(`
hi = Hi!
hello = Hello, {$name}!
welcome = Welcome to Your {$name} App!
meet = Nice to meet you!
-brand-name = Firefox
installing = Installing { -brand-name }
your-score =
    { NUMBER($score, minimumFractionDigits: 1) ->
        [0.0]   You scored zero points. What happened?
       *[other] You scored { NUMBER($score, minimumFractionDigits: 1) } points.
    }
your-rank = { NUMBER($pos, type: "ordinal") ->
    [1] You finished first!
    [one] You finished {$pos}st
    [two] You finished {$pos}nd
    [few] You finished {$pos}rd
   *[other] You finished {$pos}th
 }
last-notice = Last checked: { DATETIME($lastChecked, day: "numeric", month: "long") }.
  `);

  const bundle = new FluentBundle('en-US');

  bundle.addResource(resource);

  fluentTranslator.bundle = bundle;

  test('shorthand attribute', async () => {
    const fileName = 'ShorthandAttribute';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('v-bind attribute', async () => {
    const fileName = 'VBindAttribute';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('text template', async () => {
    const fileName = 'TextTemplate';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('left hand side operator', async () => {
    const fileName = 'LeftHandSideOperator';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('right hand side operator', async () => {
    const fileName = 'RightHandSideOperator';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('multiple translation in one expression', async () => {
    const fileName = 'Multiple';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('skip script', async () => {
    const fileName = 'SkipScript';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('skip style', async () => {
    const fileName = 'SkipStyle';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('optimize spaces', async () => {
    const fileName = 'SpaceOptimize';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('multiple sequential text template', async () => {
    const fileName = 'MultipleTextTemplate';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('use object literal as params in fluent', async () => {
    const fileName = 'fluent/ObjectLiteralParams';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('use object with data from vue instance as params in fluent', async () => {
    const fileName = 'fluent/ObjectWithVueData';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('message reference in fluent', async () => {
    const fileName = 'fluent/MessageReference';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('use data from vue instance and calling built-in function in fluent', async () => {
    const fileName = 'fluent/BuiltInFunctionWithVueData';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('calling built-in function in fluent', async () => {
    const fileName = 'fluent/BuiltInFunction';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('calling built-in date time function in fluent', async () => {
    const fileName = 'fluent/BuiltInDateTimeFunction';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });

  test('use data from vue instance and calling built-in date time function in fluent', async () => {
    const fileName = 'fluent/BuiltInDateTimeFunctionWithVueData';
    const stats = await compiler(fileName, { translator: fluentTranslator });

    expect(getCodeFromStats(stats)).toBe(getExpectedResult(fileName));
  });
});
