import { parseComponent } from 'vue-template-compiler';
import * as utils from 'loader-utils';
import { LoaderOption, FunctionNameMappings, TranslateExpression, Translator } from './interfaces';
import frenchkissTranslator from './translators/frenchkiss-translator';

const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`;
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`<${qnameCapture}`, 'g');
const startTagClose = /\s*(\/?)>/;
const endTag = new RegExp(`<\\/${qnameCapture}[^>]*>`, 'g');

const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

const bindRE = /\s:|\s\.|\sv-bind:/g;

const defaultLoaderOptions: LoaderOption = {
  translator: frenchkissTranslator
};

function extractTranslationExpression(
  expression: string,
  startPos: number,
  functionNameMappings: FunctionNameMappings
): Array<TranslateExpression> {
  const functionGroup = Object.keys(functionNameMappings).join('|');

  const translateRegExp = new RegExp(
    `(^|\\+|-|\\*|\\/|\\+\\+|--|\\(|!|==|===|!==|!=|%|\\*\\*|{|\\[|,|\\*=|\\/=|%=|\\+=|-=|\\^|\\^=|\\?\\.|\\?)\\s*(${functionGroup})\\s*\\(`,
    'g'
  );

  const array: Array<TranslateExpression> = [];
  const matches = expression.matchAll(translateRegExp);
  let pointer: number;
  for (const match of matches) {
    pointer = (match.index as number) + match[0].length; //start after (
    const stack = ['(']; // the start of the function
    let stringType = '';

    while (stack.length > 0 && pointer < expression.length) {
      const char = expression.charAt(pointer);
      // TODO: handling escape?
      switch (char) {
        // string handling
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
        // brackets handling
        case '[':
        case '{':
        case '(': {
          if (stringType === '') {
            stack.push(char);
          }
          // skip if in string
          break;
        }
        case ']': {
          if (stringType === '') {
            if (stack.length > 0 && stack[stack.length - 1] === '[') {
              stack.pop();
            } else {
              pointer = expression.length; // break from the while loop
            }
          }
          break;
        }
        case '}': {
          if (stringType === '') {
            if (stack.length > 0 && stack[stack.length - 1] === '{') {
              stack.pop();
            } else {
              pointer = expression.length; // break from the while loop
            }
          }
          break;
        }
        case ')': {
          if (stringType === '') {
            if (stack.length > 0 && stack[stack.length - 1] === '(') {
              stack.pop();
            } else {
              pointer = expression.length; // break from the while loop
            }
          }
          break;
        }
      }
      pointer++;
    }

    if (stack.length === 0 && pointer < expression.length + 1) {
      const end = pointer + startPos;

      // trim left side spaces and operators
      const content = expression.substring(match.index as number, pointer);
      const start = content.search(new RegExp(`(${functionGroup})`));

      array.push({
        start: start + startPos,
        end: end,
        content: content.substring(start, pointer),
        functionName: functionNameMappings[expression.substring(start, (match.index as number) + match[0].length - 1)]
      });
    }
  }
  return array;
}

export default function loader(source: string): string {
  const loaderOptions: LoaderOption = { ...defaultLoaderOptions, ...utils.getOptions(this) };

  let translateExpressions: Array<TranslateExpression> = [];

  const funcNameMappings = loaderOptions.translator?.mappings as FunctionNameMappings;
  const loaderTranslator = loaderOptions.translator as Translator;

  const sfc = parseComponent(source);
  const templateStart = sfc.template?.start as number;
  const templateEnd = sfc.template?.end as number;
  const toCompileSource = source.substring(templateStart, templateEnd);
  const tagsPositions: Array<number> = [];

  const startTagOpenMatches = toCompileSource.matchAll(startTagOpen);
  for (const match of startTagOpenMatches) {
    const startTagOpenPos = match.index as number;
    const endMatch = toCompileSource.substring(startTagOpenPos).match(startTagClose);

    if (endMatch == null) continue;

    const startTagClosePos = endMatch[0].length + (endMatch.index as number) + startTagOpenPos;

    tagsPositions.push(startTagOpenPos, startTagClosePos);
    // v-bind should be in between
    const bindREMatches = toCompileSource.substring(startTagOpenPos, startTagClosePos).matchAll(bindRE);
    for (const bindREMatch of bindREMatches) {
      const startAttrPos = startTagOpenPos + (bindREMatch.index as number) + bindREMatch[0].length;
      const tempMatch = toCompileSource.substring(startAttrPos).match(/="/);
      const startAttrValuePos = startAttrPos + (tempMatch?.index as number) + 2;
      const endAttrValuePos = startAttrValuePos + toCompileSource.substring(startAttrValuePos).search(/"/);
      const bindExpression = toCompileSource.substring(startAttrValuePos, endAttrValuePos);
      translateExpressions = translateExpressions.concat(
        extractTranslationExpression(bindExpression, startAttrValuePos, funcNameMappings)
      );
    }
  }

  const endTagMatches = toCompileSource.matchAll(endTag);
  for (const match of endTagMatches) {
    tagsPositions.push(match.index as number, (match.index as number) + match[0].length);
  }

  // will there be tag in tag?
  tagsPositions.sort((a, b) => a - b);

  if (tagsPositions.length > 0) {
    const matches = toCompileSource.substring(0, tagsPositions[0]).matchAll(defaultTagRE);
    for (const match of matches) {
      const start = (match.index as number) + 2; // skip the {{
      const end = match[0].length + (match.index as number) - 2; // leave the  }}
      translateExpressions = translateExpressions.concat(
        extractTranslationExpression(match[0].substring(start, end), start, funcNameMappings)
      );
    }
  }

  for (let i = 1; i < tagsPositions.length; i += 2) {
    const matches = toCompileSource.substring(tagsPositions[i], tagsPositions[i + 1]).matchAll(defaultTagRE);
    for (const match of matches) {
      const start = tagsPositions[i] + (match.index as number) + 2; // skip the {{

      translateExpressions = translateExpressions.concat(
        extractTranslationExpression(match[0].substring(2, match[0].length - 2), start, funcNameMappings)
      );
    }
  }

  translateExpressions.sort((a, b) => a.start - b.start);

  if (translateExpressions.length === 0) return source;

  let result = source.substring(0, templateStart);
  let translatingPointer = 0;
  for (const translateExpression of translateExpressions) {
    const params = translateExpression.content.substring(
      translateExpression.content.search(/\(/) + 1,
      translateExpression.content.length - 1
    );

    const translateFunc = loaderTranslator[translateExpression.functionName];
    if (translateFunc != null) {
      try {
        const translated = translateFunc(params);
        result = result + toCompileSource.substring(translatingPointer, translateExpression.start) + translated;
      } catch (err) {
        result =
          result +
          toCompileSource.substring(translatingPointer, translateExpression.start) +
          translateExpression.content;
      }
    } else {
      result =
        result + toCompileSource.substring(translatingPointer, translateExpression.start) + translateExpression.content;
    }
    translatingPointer = translateExpression.end;
  }
  result = result + toCompileSource.substring(translatingPointer) + source.substring(templateEnd);

  return result;
}
