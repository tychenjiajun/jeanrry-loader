import { Translator } from '../interfaces';
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
          return {
            result: expression.substring(0, p + 1).trim(),
            rest: expression.substring(p + 1).trim()
          };
        }
        break;
      }
      case '"': {
        if (stringType === '') stringType = '"';
        // starting string
        else if (stringType === '"') {
          // ending string
          return {
            result: expression.substring(0, p + 1).trim(),
            rest: expression.substring(p + 1).trim()
          };
        }
        break;
      }
      case '`': {
        if (stringType === '') stringType = '`';
        // starting string
        else if (stringType === '`') {
          // ending string
          return {
            result: expression.substring(0, p + 1).trim(),
            rest: expression.substring(p + 1).trim()
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

function extractParams(expression: string): { result: string; rest: string } {
  let p = 0;
  if (expression.charAt(0) !== '{') throw new Error('Params should be an object.');
  const stack = ['{'];
  let stringType = '';
  for (p = 1; p < expression.length; p++) {
    switch (expression.charAt(p)) {
      case "'": {
        if (stringType === '') stringType = "'";
        // starting string
        else if (stringType === "'") {
          // ending string
          stringType = '';
        }
        break;
      }
      case '"': {
        if (stringType === '') stringType = '"';
        // starting string
        else if (stringType === '"') {
          // ending string
          stringType = '';
        }
        break;
      }
      case '`': {
        if (stringType === '') stringType = '`';
        // starting string
        else if (stringType === '`') {
          // ending string
          stringType = '';
        }
        break;
      }
      case '{': {
        stack.push('{');
        break;
      }
      case '}': {
        stack.pop();
        if (stack.length === 0)
          return {
            result: expression.substring(0, p + 1).trim(),
            rest: expression.substring(p + 1).trim()
          };
      }
    }
  }
  throw new Error('Params should be an object.');
}

const translator: Translator = {
  mappings: {
    t: 't'
  },
  t(paramsExpression: string): string {
    paramsExpression = paramsExpression.trim();
    let { result, rest } = extractKey(paramsExpression);
    const key = result.substring(1, result.length - 1);
    let commaIdx = rest.search(/,/);
    if (rest.search(/,/) === -1) {
      return `'${kiss.t(key)}'`;
    }
    rest = rest.substring(commaIdx + 1).trim();
    if (rest.length === 0) {
      return `'${kiss.t(key)}'`;
    }
    ({ result, rest } = extractParams(rest));
    const paramsStr = result;
    commaIdx = rest.search(/,/);
    rest = rest.substring(commaIdx + 1).trim();
    const language = rest.length === 0 ? kiss.locale() : rest;

    try {
      const params = new Function('"use strict"; return ' + paramsStr)();
      return `'${kiss.t(key, params, language)}'`;
    } catch (err) {
      try {
        kiss.t(key, {}, language); // fresh the cache
      } catch (err) {
        // ignore
      }
      const funcStr = kiss.cache[language][key]
        .toString()
        .trim()
        .replace(/(\r\n|\n|\r)/gm, ' ')
        .replace(/( anonymous)/g, '');
      return `(${funcStr})(${paramsStr})`.replace(/"/, '\'');
    }
  }
};

export default translator;
