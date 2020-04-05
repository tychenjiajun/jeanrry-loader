import { parseComponent } from 'vue-template-compiler';
import * as utils from 'loader-utils';
import { LoaderOption, TranslateExpression, Translator, ExpressionType, FunctionNameMappings } from './interfaces';
import frenchkissTranslator from './translators/frenchkiss-translator';

const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`;
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTag = new RegExp(`<${qnameCapture}.*(( :| \\.| v-bind:).*\\=".*").*(\\/?)>`, 'g');
const endTag = new RegExp(`<\\/${qnameCapture}[^>]*>`, 'g');

const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/;

const bindRE = /\s:|\s\.|\sv-bind:/g;

const defaultLoaderOptions: LoaderOption = {
  translator: frenchkissTranslator
};

/**
 * Extract translation expressions from am expression in Vue template syntax.
 * @param expression The expression placed in the Vue template syntax.
 * @param beginPos The start position of the expression in the whole template.
 * @param functionNameMappings THe function name mappings in translator.
 */
function extractTranslationExpression(
  expression: string,
  beginPos: number,
  functionNameMappings: FunctionNameMappings,
  type: ExpressionType
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
    const beginPosInMatch = beginPos + (match.index as number);

    if (array.length > 0 && beginPosInMatch < array[array.length - 1].end) continue; // todo: support nested translation expression

    pointer = (match.index as number) + match[0].length; // start after (
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
      const end = pointer + beginPos;

      // trim left side spaces and operators
      const content = expression.substring(match.index as number, pointer);
      const beginPosInFunc = content.search(new RegExp(`(${functionGroup})`));

      array.push({
        begin: beginPosInFunc + beginPosInMatch,
        end: end,
        content: content.substring(beginPosInFunc, pointer),
        functionName: functionNameMappings[match[2]],
        type: type,
        optimize: content.substring(beginPosInFunc, pointer) === expression.trim()
      });
    }
  }
  return array;
}

export default function loader(source: string): string {
  const loaderOptions: LoaderOption = { ...defaultLoaderOptions, ...utils.getOptions(this) };

  let translateExpressions: Array<TranslateExpression> = [];

  const loaderTranslator = loaderOptions.translator as Translator;

  const sfc = parseComponent(source);
  const templateStart = sfc.template?.start as number;
  const templateEnd = sfc.template?.end as number;
  const toCompileSource = source.substring(templateStart, templateEnd);
  const tagsPositions: Array<number> = [];

  const startTagMatches = toCompileSource.matchAll(startTag);
  for (const match of startTagMatches) {
    const startTagOpenPos = match.index as number;
    // v-bind should be in between
    const bindREMatches = match[0].matchAll(bindRE);
    for (const bindREMatch of bindREMatches) {
      const startAttrPos = startTagOpenPos + (bindREMatch.index as number) + bindREMatch[0].length;
      const tempMatch = toCompileSource.substring(startAttrPos).match(/="/);
      const startAttrValuePos = startAttrPos + (tempMatch?.index as number) + 2;
      const endAttrValuePos = startAttrValuePos + toCompileSource.substring(startAttrValuePos).search(/"/);
      const bindExpression = toCompileSource.substring(startAttrValuePos, endAttrValuePos);
      translateExpressions = translateExpressions.concat(
        extractTranslationExpression(
          bindExpression,
          startAttrValuePos,
          loaderTranslator.functionNameMappings,
          ExpressionType.attr
        )
      );
    }
  }

  const endTagMatches = toCompileSource.matchAll(endTag);
  for (const match of endTagMatches) {
    tagsPositions.push(match.index as number, (match.index as number) + match[0].length);
  }

  tagsPositions.sort((a, b) => a - b);

  if (tagsPositions.length > 0) {
    const matches = toCompileSource.substring(0, tagsPositions[0]).matchAll(defaultTagRE);
    for (const match of matches) {
      let begin = (match.index as number) + 2; // skip the {{
      for (; toCompileSource.charAt(begin) === ' '; begin++);
      translateExpressions = translateExpressions.concat(
        extractTranslationExpression(match[1].trim(), begin, loaderTranslator.functionNameMappings, ExpressionType.text)
      );
    }
  }

  for (let i = 1; i < tagsPositions.length; i += 2) {
    const matches = toCompileSource.substring(tagsPositions[i], tagsPositions[i + 1]).matchAll(defaultTagRE);
    for (const match of matches) {
      let begin = tagsPositions[i] + (match.index as number) + 2; // skip the {{
      for (; toCompileSource.charAt(begin) === ' '; begin++);

      translateExpressions = translateExpressions.concat(
        extractTranslationExpression(match[1].trim(), begin, loaderTranslator.functionNameMappings, ExpressionType.text)
      );
    }
  }

  translateExpressions.sort((a, b) => a.begin - b.begin);

  if (translateExpressions.length === 0) return source;

  let result = source.substring(0, templateStart);
  let translatingPointer = 0;
  for (const translateExpression of translateExpressions) {
    try {
      const translated = loaderTranslator.translate(translateExpression);
      if (translateExpression.type === ExpressionType.attr) {
        translated.content = translated.content.replace(/"/g, '');
      }
      if (translateExpression.optimize && translated.optimized) {
        switch (translateExpression.type) {
          case ExpressionType.attr: {
            for (
              translateExpression.begin = translateExpression.begin - 1;
              toCompileSource.charAt(translateExpression.begin) === ' ';
              translateExpression.begin = translateExpression.begin - 1
            );
            for (
              ;
              toCompileSource.charAt(translateExpression.end) === ' ';
              translateExpression.end = translateExpression.end + 1
            );
            let attrBegin = translateExpression.begin - 1;
            for (; toCompileSource.charAt(attrBegin) !== ' '; attrBegin--);
            const attrName = toCompileSource.substring(attrBegin, translateExpression.begin - 1).split(':')[1];
            if (!attrName.startsWith('[')) {
              translated.content = attrName + '="' + translated.content;
              translateExpression.begin = attrBegin + 1;
            }
            break;
          }
          case ExpressionType.text: {
            for (
              translateExpression.begin = translateExpression.begin - 1;
              toCompileSource.charAt(translateExpression.begin) === ' ';
              translateExpression.begin = translateExpression.begin - 1
            );
            for (
              ;
              toCompileSource.charAt(translateExpression.end) === ' ';
              translateExpression.end = translateExpression.end + 1
            );
            translateExpression.begin = translateExpression.begin - 1; // {{
            translateExpression.end = translateExpression.end + 2; // }}
            break;
          }
        }
      }
      result = result + toCompileSource.substring(translatingPointer, translateExpression.begin) + translated.content;
    } catch (err) {
      result =
        result + toCompileSource.substring(translatingPointer, translateExpression.begin) + translateExpression.content;
    }
    translatingPointer = translateExpression.end;
  }
  result = result + toCompileSource.substring(translatingPointer) + source.substring(templateEnd);

  return result;
}
