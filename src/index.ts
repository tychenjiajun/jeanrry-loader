import * as utils from 'loader-utils';
import { LoaderOption, TranslateExpression, Translator, ExpressionType, FunctionNameMappings } from './interfaces';
import frenchkissTranslator from './translators/frenchkiss-translator';

const unicodeRegExp = /a-zA-Z\u00B7\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u037D\u037F-\u1FFF\u200C-\u200D\u203F-\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD/;

const attribute = /^\s*([^\s"'<>/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const dynamicArgAttribute = /^\s*((?:v-[\w-]+:|@|:|#)\[[^=]+\][^\s"'<>/=]*)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z${unicodeRegExp.source}]*`;
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
const startTagOpen = new RegExp(`^<${qnameCapture}`);
const startTagClose = /^\s*(\/?)>/;
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
const doctype = /^<!DOCTYPE [^>]+>/i;
// #7298: escape - to avoid being passed as HTML comment when inlined in page
const comment = /^<!--/;
const conditionalComment = /^<!\[/;

const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/;

const bindRE = /^:|^\.|^v-bind:/;

const defaultLoaderOptions: LoaderOption = {
  translator: frenchkissTranslator
};

/**
 * Extract translation expressions from an expression in Vue template syntax.
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
      const brackets = '[]{}()';
      if (brackets.includes(char) && stringType === '') {
        if ((brackets.indexOf(char) & 1) === 0) {
          stack.push(char);
        } else if (stack.length > 0 && brackets.charAt(brackets.indexOf(stack[stack.length - 1]) + 1) === char) {
          stack.pop();
        } else {
          pointer = expression.length;
        }
      }
      if (char.match(/['"`]/)) {
        stringType = stringType.length > 0 ? '' : char;
      }
      // TODO: handling escape?
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
        type: type
      });
    }
  }
  return array;
}

export default function loader(html: string): string {
  const loaderOptions: LoaderOption = { ...defaultLoaderOptions, ...utils.getOptions(this) };

  const loaderTranslator = loaderOptions.translator as Translator;

  let lastTag;

  let result = '';

  const stack: Array<{ tagName: string; translate: boolean }> = [];

  function advance(n: number): string {
    const ret = html.substring(0, n);
    html = html.substring(n);
    return ret;
  }

  while (html) {
    // Make sure we're not in a plaintext content element like script/style
    if (lastTag == null || !['script', 'style', 'textarea'].includes(lastTag.tagName)) {
      let textEnd = html.indexOf('<');
      if (textEnd === 0) {
        // Comment:
        if (comment.test(html)) {
          const commentEnd = html.indexOf('-->');

          if (commentEnd >= 0) {
            result += advance(commentEnd + 3);
            continue;
          }
        }

        // http://en.wikipedia.org/wiki/Conditional_comment#Downlevel-revealed_conditional_comment
        if (conditionalComment.test(html)) {
          const conditionalEnd = html.indexOf(']>');

          if (conditionalEnd >= 0) {
            result += advance(conditionalEnd + 2);
            continue;
          }
        }

        // Doctype:
        const doctypeMatch = html.match(doctype);
        if (doctypeMatch) {
          result += advance(doctypeMatch[0].length);
          continue;
        }

        // End tag:
        const endTagMatch = html.match(endTag);
        if (endTagMatch) {
          result += advance(endTagMatch[0].length);
          const tagName = endTagMatch[1];
          let pos = 0;
          for (pos = stack.length - 1; pos >= 0; pos--) {
            if (stack[pos].tagName !== tagName) {
              stack.pop();
            } else {
              stack.pop();
              break;
            }
          }
          if (pos === -1) {
            return result + html;
          }
          if (pos === 0 && tagName === 'template') {
            return result + html;
          }
          lastTag = stack[pos - 1];
          continue;
        }

        // Start tag:
        const startTagMatch = html.match(startTagOpen);
        if (startTagMatch) {
          stack.push({
            tagName: startTagMatch[1],
            translate: stack.length === 0 ? true : stack[stack.length - 1].translate
          });
          lastTag = stack[stack.length - 1];
          result += advance(startTagMatch[0].length);
          let resultIfNotTranslate = result;
          let end, attr;
          attr = html.match(dynamicArgAttribute) || html.match(attribute);
          while (attr) {
            resultIfNotTranslate += attr[0];
            const bindREMatch = attr[1].match(bindRE);
            if (lastTag.tagName === 'template' && stack.length === 1) {
              result += advance(attr[0].length);
            } else if (attr[1] === 'translate') {
              result += advance(attr[0].length);
              const attrValue = attr[3] || attr[4] || attr[5] || '';
              stack[stack.length - 1].translate =
                (attrValue === 'yes' || attrValue === '' || stack[stack.length - 1].translate) && attrValue !== 'no';
              lastTag = stack[stack.length - 1];
            } else if (bindREMatch == null) {
              result += advance(attr[0].length);
            } else {
              const attrValue = attr[3] || attr[4] || attr[5] || '';
              const exps = extractTranslationExpression(
                attrValue,
                0,
                loaderTranslator.functionNameMappings,
                ExpressionType.attr
              );
              let translatedAttrValue = '';
              let prevIdx = 0;
              for (const exp of exps) {
                translatedAttrValue += attrValue.substring(prevIdx, exp.begin);
                try {
                  const tr = loaderTranslator.translate(exp).content;
                  translatedAttrValue += tr;
                } catch (err) {
                  console.warn(`Skipping translation [ ${exp.content} ] in ${this.resource}: ${err}`);
                  translatedAttrValue += exp.content;
                }
                prevIdx = exp.end;
              }
              translatedAttrValue += attrValue.substring(prevIdx);
              result += advance(attr[0].length - attr[0].trimStart().length);
              try {
                const optimizedTranslatedAttrValue = (new Function(
                  '"use strict"; return (' + translatedAttrValue + ')'
                )() as string)
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#39;');
                advance(bindREMatch[0].length);
                result += advance(attr[1].length - bindREMatch[0].length);
                result += advance(attr[2].length);
                result += advance(
                  (attr[0].trimStart().length - attrValue.length - attr[1].length - attr[2].length) / 2
                );
                result += optimizedTranslatedAttrValue;
                advance(attrValue.length);
                result += advance(
                  (attr[0].trimStart().length - attrValue.length - attr[1].length - attr[2].length) / 2
                );
              } catch (err) {
                result += advance(attr[1].length);
                result += advance(attr[2].length);
                result += advance(
                  (attr[0].trimStart().length - attrValue.length - attr[1].length - attr[2].length) / 2
                );
                result += translatedAttrValue;
                advance(attrValue.length);
                result += advance(
                  (attr[0].trimStart().length - attrValue.length - attr[1].length - attr[2].length) / 2
                );
              }
            }
            attr = html.match(dynamicArgAttribute) || html.match(attribute);
            end = html.match(startTagClose);
          }
          if (end) {
            if (!lastTag.translate) {
              result = resultIfNotTranslate;
            }
            result += advance(end[0].length);
          }
          continue;
        }
      }

      // else text end large than 0: handling text

      let text, rest, next;
      if (textEnd >= 0) {
        rest = html.slice(textEnd);
        while (
          !endTag.test(rest) &&
          !startTagOpen.test(rest) &&
          !comment.test(rest) &&
          !conditionalComment.test(rest)
        ) {
          // < in plain text, be forgiving and treat it as text
          next = rest.indexOf('<', 1);
          if (next < 0) break;
          textEnd += next;
          rest = html.slice(textEnd);
        }
        text = html.substring(0, textEnd);
      }

      // the rest are all text
      if (textEnd < 0) {
        text = html;
      }

      if (text) {
        if (lastTag != null && lastTag.translate) {
          let match = text.match(defaultTagRE);
          while (match != null) {
            result += advance(match.index as number);
            const leftSpaces = match[1].length - match[1].trimStart().length;
            const rightSpaces = match[1].length - match[1].trimEnd().length;
            const originalExp = match[1].trim();
            const exps = extractTranslationExpression(
              match[1].trim(),
              0,
              loaderTranslator.functionNameMappings,
              ExpressionType.text
            );
            let translatedValue = '';
            let prevIdx = 0;
            for (const exp of exps) {
              translatedValue += originalExp.substring(prevIdx, exp.begin);
              try {
                const tr = loaderTranslator.translate(exp).content;
                translatedValue += tr;
              } catch (err) {
                console.warn(`Skipping translation [ ${exp.content} ] in ${this.resource}: ${err}`);
                translatedValue += exp.content;
              }
              prevIdx = exp.end;
            }
            translatedValue += originalExp.substring(prevIdx);
            try {
              const optimizedTranslatedValue = (new Function(
                '"use strict"; return (' + translatedValue + ')'
              )() as string)
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
              advance(match[0].length);
              result += optimizedTranslatedValue;
            } catch (err) {
              result += advance((match[0].length - match[1].length) / 2);
              result += advance(leftSpaces);
              result += translatedValue;
              advance(originalExp.length);
              result += advance(rightSpaces);
              result += advance((match[0].length - match[1].length) / 2);
            }
            text = text.substring(match[0].length + (match.index as number));
            match = text.match(defaultTagRE);
          }
        }
        result += advance(text.length);
      }
    } else {
      // expecting end of script style or textarea
      const reg = new RegExp('([\\s\\S]*?)(</' + lastTag + '[^>]*>)');
      const regMatch = html.match(reg);
      if (stack.length < 1 || regMatch == null) {
        return result + html;
      }
      lastTag = stack.pop();

      result += advance(regMatch[0].length);
    }
  }

  return result;
}
