import { Translator, TranslateExpression, TranslateResult, ExpressionType } from '../interfaces';
import * as kiss from 'frenchkiss';

kiss.onMissingVariable((variable, key, language) => {
  throw new Error(`Missing the variable "${variable}" in ${language}->${key}.`);
});

function extractKey(expression: string): { result: string; rest: string } {
  if (expression.trim().length === 0) throw new Error('Key is required!');
  if ([...expression.matchAll(/['"`]/g)].length < 2) throw new Error('Key should be a string!');
  let p = 0;
  let stringType = '';
  for (; p < expression.length; p++) {
    switch (expression.charAt(p)) {
      case "'": {
        if (stringType === '') stringType = "'";
        // starting string
        else if (stringType === "'") {
          // ending string
          let rest = expression.substring(p + 1).trim();
          if (rest.length > 0 && rest.charAt(0) === ',') rest = rest.substr(1);
          return {
            result: expression.substring(0, p + 1).trim(),
            rest: rest
          };
        }
        break;
      }
      case '"': {
        if (stringType === '') stringType = '"';
        // starting string
        else if (stringType === '"') {
          // ending string
          let rest = expression.substring(p + 1).trim();
          if (rest.length > 0 && rest.charAt(0) === ',') rest = rest.substr(1);
          return {
            result: expression.substring(0, p + 1).trim(),
            rest: rest
          };
        }
        break;
      }
      case '`': {
        if (stringType === '') stringType = '`';
        // starting string
        else if (stringType === '`') {
          // ending string
          let rest = expression.substring(p + 1).trim();
          if (rest.length > 0 && rest.charAt(0) === ',') rest = rest.substr(1);
          return {
            result: expression.substring(0, p + 1).trim(),
            rest: rest
          };
        }
        break;
      }
      case ',': {
        if (stringType === '') throw new Error('Key is required!');
      }
    }
  }
  throw new Error('Key is required!');
}

function extractLocale(
  expression: string
): {
  result: string;
  rest: string;
} {
  expression = expression.trim();
  let p = expression.length - 1;
  if (["'", '"', '`'].indexOf(expression.charAt(p)) < 0) {
    if (expression.charAt(p) === ',') {
      return {
        result: '',
        rest: expression.substring(0, p)
      };
    } else {
      return {
        result: '',
        rest: expression
      };
    }
  }
  let stringType = '';
  for (; p > 1; p--) {
    switch (expression.charAt(p)) {
      case "'": {
        if (stringType === '') stringType = "'";
        // starting string
        else if (stringType === "'") {
          // ending string
          let rest = expression.substring(0, p).trim();
          if (rest.length === 0) throw new Error('Params should not be a string literal!');
          if (rest.charAt(rest.length - 1) === ',') {
            rest = rest.substring(0, rest.length - 1);
          } else {
            throw new Error('Tagged template is not supported!');
          }
          return {
            rest: rest,
            result: expression.substring(p).trim()
          };
        }
        break;
      }
      case '"': {
        if (stringType === '') stringType = '"';
        // starting string
        else if (stringType === '"') {
          // ending string
          let rest = expression.substring(0, p).trim();
          if (rest.length === 0) throw new Error('Params should not be a string literal!');
          if (rest.charAt(rest.length - 1) === ',') {
            rest = rest.substring(0, rest.length - 1);
          } else {
            throw new Error('Tagged template is not supported!');
          }
          return {
            rest: rest,
            result: expression.substring(p).trim()
          };
        }
        break;
      }
      case '`': {
        if (stringType === '') stringType = '`';
        // starting string
        else if (stringType === '`') {
          // ending string
          let rest = expression.substring(0, p).trim();
          if (rest.length === 0) throw new Error('Params should not be a string literal!');
          if (rest.charAt(rest.length - 1) === ',') {
            rest = rest.substring(0, rest.length - 1);
          } else {
            throw new Error('Tagged template is not supported!');
          }
          return {
            rest: rest,
            result: expression.substring(p).trim()
          };
        }
        break;
      }
      case ',': {
        if (stringType === '') throw new Error('Key is required!');
      }
    }
  }
  throw new Error('Unexpected parsing error!');
}

const translator: Translator = {
  functionNameMappings: {
    t: 't'
  },
  translate(translateExpression: TranslateExpression): TranslateResult {
    const paramsExpression = translateExpression.content
      .substring(translateExpression.content.search(/\(/) + 1, translateExpression.content.length - 1)
      .trim();
    let { result, rest } = extractKey(paramsExpression);
    const key = result.substring(1, result.length - 1);

    if (rest.length === 0) {
      const temp = kiss.t(key);

      return {
        optimized: true,
        content: `'${temp}'`
      };
    }
    ({ result, rest } = extractLocale(rest));

    const language = result.length === 0 ? kiss.locale() : result;

    const paramsStr = rest;

    try {
      kiss.t(key, {}, language); // fresh the cache
    } catch (err) {
      // ignore
    }
    let funcStr = kiss.cache[language][key]
      .toString()
      .trim()
      .replace(/(\r\n|\n|\r)/gm, ' ')
      .replace(/( anonymous)/g, '');

    if (translateExpression.type === ExpressionType.attr) {
      funcStr = funcStr.replace(/"/g, "'");
    }
    return {
      optimized: false,
      content: `(${funcStr})(${paramsStr})`
    };
  }
};

export default translator;
