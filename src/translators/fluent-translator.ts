/* eslint-disable @typescript-eslint/no-use-before-define */
import { Translator, TranslateExpression, TranslateResult } from '../interfaces';
import { FluentBundle } from '@fluent/bundle';
import {
  Pattern,
  ComplexPattern,
  Expression,
  VariableReference,
  MessageReference,
  TermReference,
  NamedArgument,
  FunctionReference,
  SelectExpression,
  Variant
} from '@fluent/bundle/esm/ast';
import { FluentArgument } from '@fluent/bundle/esm/bundle';
import { Scope } from '@fluent/bundle/esm/scope';
import { FluentNone, FluentValue, FluentNumber, FluentType, FluentDateTime } from '@fluent/bundle/esm/types';
import { extractKey } from '../helpers/extract';

// The maximum number of placeables which can be expanded in a single call to
// `formatPattern`. The limit protects against the Billion Laughs and Quadratic
// Blowup attacks. See https://msdn.microsoft.com/en-us/magazine/ee335713.aspx.
const MAX_PLACEABLES = 100;

// Unicode bidi isolation characters.
const FSI = `'&#x2068;'`;
const PDI = `'&#x2069;'`;

export interface FluentTranslator extends Translator {
  bundle: FluentBundle | null;
}

function extractParams(expression: string): Record<string, FluentArgument> {
  const result: Record<string, FluentArgument> = {};
  expression = expression.trim();
  if (expression.length === 0) return {};
  if (expression.charAt(0) !== '{') throw new Error('Args should be a record');
  let stringType = '';
  let keyStart = 1;
  let valueStart = 1;
  let key = '';
  const valueStack = [];
  for (let i = 1; i < expression.length; i++) {
    const char = expression.charAt(i);
    switch (char) {
      case ':': {
        if (key === '' && stringType === '') {
          key = expression.substring(keyStart, i).trim();
          valueStart = i + 1;
        }
        break;
      }
      case `'`: {
        if (key === '') {
          if (stringType === `'`) {
            stringType = '';
            let j = i;
            for (j = i + 1; j < expression.length && expression.charAt(j) === ' '; j++);
            if (expression.charAt(j) !== ':') {
              throw new Error('Args should be a valid record');
            } else {
              key = expression.substring(keyStart, i);
              i = j;
              valueStart = i + 1;
            }
          } else {
            stringType = `'`;
            if (expression.substring(keyStart, i).trim() !== '') throw new Error('Args should be a valid record');
            keyStart = i + 1;
            key = '';
          }
        } else {
          if (stringType === `'`) {
            stringType = '';
          } else {
            stringType = `'`;
          }
        }
        break;
      }
      case '`': {
        if (key === '') {
          if (stringType === '') {
            throw new Error('Args should be a valid record');
          }
        } else {
          if (stringType === `'`) {
            stringType = '';
          } else {
            stringType = `'`;
          }
        }
        break;
      }
      case '[':
      case '{':
      case '(': {
        if (key === '') {
          if (stringType === '') {
            throw new Error('Args should be a valid record');
          }
        } else {
          if (stringType === '') {
            valueStack.push(char);
          }
        }
        break;
      }
      case ']': {
        if (key === '') {
          if (stringType === '') {
            throw new Error('Args should be a valid record');
          }
        } else {
          if (stringType === '' && valueStack.length > 0 && valueStack[valueStack.length - 1] === '[') {
            valueStack.pop();
          }
        }
        break;
      }
      case '}': {
        if (key === '') {
          if (stringType === '') {
            if (expression.substr(i + 1).trim() !== '' || expression.substring(keyStart, i).trim() !== '') {
              throw new Error('Args should be a valid record');
            } else {
              i = expression.length;
            }
          }
        } else {
          if (stringType === '') {
            if (valueStack.length > 0 && valueStack[valueStack.length - 1] === '{') {
              valueStack.pop();
            } else if (expression.substr(i + 1).trim() !== '') {
              throw new Error('Args should be a valid record');
            } else {
              const value = expression.substring(valueStart, i).trim();
              if (Number(value) !== Number(value)) {
                result[key] = value;
              } else {
                result[key] = Number(value);
              }
              keyStart = i + 1;
              key = '';
              i = expression.length;
            }
          }
        }
        break;
      }
      case ')': {
        if (key === '') {
          if (stringType === '') {
            throw new Error('Args should be a valid record');
          }
        } else {
          if (stringType === '' && valueStack.length > 0 && valueStack[valueStack.length - 1] === '(') {
            valueStack.pop();
          }
        }
        break;
      }
      case ',': {
        if (key === '') {
          if (stringType === '') {
            throw new Error('Args should be a valid record');
          }
        } else if (valueStack.length === 0) {
          const value = expression.substring(valueStart, i).trim();
          if (Number(value) !== Number(value)) {
            result[key] = value;
          } else {
            result[key] = Number(value);
          }
          keyStart = i + 1;
          key = '';
        }
      }
    }
  }
  return result;
}

function resolveVariableReference(scope: Scope, { name }: VariableReference): FluentValue {
  let arg: FluentArgument;
  if (scope.params) {
    // We're inside a TermReference. It's OK to reference undefined parameters.
    if (Object.prototype.hasOwnProperty.call(scope.params, name)) {
      arg = scope.params[name];
    } else {
      return new FluentNone(`$${name}`);
    }
  } else if (scope.args && Object.prototype.hasOwnProperty.call(scope.args, name)) {
    // We're in the top-level Pattern or inside a MessageReference. Missing
    // variables references produce ReferenceErrors.
    arg = scope.args[name];
  } else {
    scope.reportError(new ReferenceError(`Unknown variable: $${name}`));
    return new FluentNone(`$${name}`);
  }

  // Return early if the argument already is an instance of FluentType.
  if (arg instanceof FluentType) {
    return arg;
  }

  // Convert the argument to a Fluent type.
  switch (typeof arg) {
    case 'string':
      return arg;
    case 'number':
      return new FluentNumber(arg);
    case 'object':
      if (arg instanceof Date) {
        return new FluentDateTime(arg.getTime());
      }
    // eslint-disable-next-line no-fallthrough
    default:
      scope.reportError(new TypeError(`Variable type not supported: $${name}, ${typeof arg}`));
      return new FluentNone(`$${name}`);
  }
}

// Resolve a simple or a complex Pattern to a FluentString (which is really the
// string primitive).
function resolvePattern(scope: Scope, value: Pattern): FluentValue {
  // Resolve a simple pattern.
  if (typeof value === 'string') {
    return scope.bundle._transform(value);
  }

  return resolveComplexPattern(scope, value);
}

// Resolve a reference to another message.
function resolveMessageReference(scope: Scope, { name, attr }: MessageReference): FluentValue {
  const message = scope.bundle._messages.get(name);
  if (!message) {
    scope.reportError(new ReferenceError(`Unknown message: ${name}`));
    return new FluentNone(name);
  }

  if (attr) {
    const attribute = message.attributes[attr];
    if (attribute) {
      return resolvePattern(scope, attribute);
    }
    scope.reportError(new ReferenceError(`Unknown attribute: ${attr}`));
    return new FluentNone(`${name}.${attr}`);
  }

  if (message.value) {
    return resolvePattern(scope, message.value);
  }

  scope.reportError(new ReferenceError(`No value: ${name}`));
  return new FluentNone(name);
}

interface Arguments {
  positional: Array<FluentValue>;
  named: Record<string, FluentValue>;
}

function getArguments(scope: Scope, args: Array<Expression | NamedArgument>): Arguments {
  const positional: Array<FluentValue> = [];
  const named: Record<string, FluentValue> = Object.create(null);

  for (const arg of args) {
    if (arg.type === 'narg') {
      named[arg.name] = resolveExpression(scope, arg.value);
    } else {
      positional.push(resolveExpression(scope, arg));
    }
  }

  return { positional, named };
}

// Resolve a call to a Term with key-value arguments.
function resolveTermReference(scope: Scope, { name, attr, args }: TermReference): FluentValue {
  const id = `-${name}`;
  const term = scope.bundle._terms.get(id);
  if (!term) {
    scope.reportError(new ReferenceError(`Unknown term: ${id}`));
    return new FluentNone(id);
  }

  if (attr) {
    const attribute = term.attributes[attr];
    if (attribute) {
      // Every TermReference has its own variables.
      scope.params = getArguments(scope, args).named;
      const resolved = resolvePattern(scope, attribute);
      scope.params = null;
      return resolved;
    }
    scope.reportError(new ReferenceError(`Unknown attribute: ${attr}`));
    return new FluentNone(`${id}.${attr}`);
  }

  scope.params = getArguments(scope, args).named;
  const resolved = resolvePattern(scope, term.value);
  scope.params = null;
  return resolved;
}

// Resolve a call to a Function with positional and key-value arguments.
function resolveFunctionReference(scope: Scope, { name, args }: FunctionReference): FluentValue {
  // Some functions are built-in. Others may be provided by the runtime via
  // the `FluentBundle` constructor.
  const func = scope.bundle._functions[name];
  if (!func) {
    scope.reportError(new ReferenceError(`Unknown function: ${name}()`));
    return new FluentNone(`${name}()`);
  }

  if (typeof func !== 'function') {
    scope.reportError(new TypeError(`Function ${name}() is not callable`));
    return new FluentNone(`${name}()`);
  }

  const resolved = getArguments(scope, args);

  try {
    return func(resolved.positional, resolved.named);
  } catch (err) {
    if (name === 'NUMBER') {
      return `new Intl.NumberFormat(['${scope.bundle.locales.join("', '")}'], { ${Object.entries(resolved.named)
        .map(s => [s[0], typeof s[1] === 'string' ? "'" + s[1] + "'" : s[1].toString(scope)])
        .map(s => s.join(': '))
        .join(', ')} }).format(${resolved.positional[0].toString(scope)})`;
    }
    if (name === 'DATETIME') {
      return `new Intl.DateTimeFormat(['${scope.bundle.locales.join("', '")}'], { ${Object.entries(resolved.named)
        .map(s => [s[0], typeof s[1] === 'string' ? "'" + s[1] + "'" : s[1].toString(scope)])
        .map(s => s.join(': '))
        .join(', ')} }).format(${resolved.positional[0].toString(scope)})`;
    }
    scope.reportError(err);
    return new FluentNone(`${name}()`);
  }
}

// Helper: resolve the default variant from a list of variants.
function getDefault(scope: Scope, variants: Array<Variant>, star: number): FluentValue {
  if (variants[star]) {
    return resolvePattern(scope, variants[star].value);
  }

  scope.reportError(new RangeError('No default'));
  return new FluentNone();
}

// Resolve a select expression to the member object.
function resolveSelectExpression(scope: Scope, { selector, variants, star }: SelectExpression): FluentValue {
  let sel = resolveExpression(scope, selector);

  let selNum: FluentNumber = new FluentNumber(NaN);

  if (sel instanceof FluentNumber) {
    selNum = sel;
    sel = sel.toString(scope);
  }

  let pluraledSel = '';

  if (typeof sel === 'string' && sel.startsWith('new Intl.NumberFormat(')) {
    pluraledSel = `new Intl.PluralRules(['${scope.bundle.locales.join("', '")}'], ${sel
      .substring(sel.indexOf('],') + 2, sel.indexOf('}).') + 1)
      .trim()}).select(${sel})`;
  }

  let result = '';

  // Match the selector against keys of each variant, in order.
  for (const variant of variants) {
    const key = resolveExpression(scope, variant.key);
    const match = resolvePattern(scope, variant.value);
    if (key instanceof FluentNumber && selNum.value === key.value) {
      return match;
    }

    if (key instanceof FluentNumber && pluraledSel !== '') {
      result = result + `('${key.toString(scope)}') === (${sel}) ? (${match}) : `;
      continue;
    }

    result = result + `('${key}') === (${pluraledSel}) ? (${match}) : `;
  }

  return result + `(${getDefault(scope, variants, star)})`;
}

function resolveExpression(scope: Scope, expr: Expression): FluentValue {
  switch (expr.type) {
    case 'str':
      // todo: escape?
      return expr.value;
    case 'num':
      return new FluentNumber(expr.value, {
        minimumFractionDigits: expr.precision
      });
    case 'var':
      return resolveVariableReference(scope, expr);
    case 'mesg':
      return resolveMessageReference(scope, expr);
    case 'term':
      return resolveTermReference(scope, expr);
    case 'func':
      return resolveFunctionReference(scope, expr);
    case 'select':
      return resolveSelectExpression(scope, expr);
    default:
      return new FluentNone();
  }
}

function resolveComplexPattern(scope: Scope, ptn: ComplexPattern): FluentValue {
  if (scope.dirty.has(ptn)) {
    scope.reportError(new RangeError('Cyclic reference'));
    return new FluentNone();
  }

  // Tag the pattern as dirty for the purpose of the current resolution.
  scope.dirty.add(ptn);
  const result = [];

  // Wrap interpolations with Directional Isolate Formatting characters
  // only when the pattern has more than one element.
  const useIsolating = scope.bundle._useIsolating && ptn.length > 1;

  for (const elem of ptn) {
    if (typeof elem === 'string') {
      result.push(scope.bundle._transform(elem));
      continue;
    }

    scope.placeables++;
    if (scope.placeables > MAX_PLACEABLES) {
      scope.dirty.delete(ptn);
      // This is a fatal error which causes the resolver to instantly bail out
      // on this pattern. The length check protects against excessive memory
      // usage, and throwing protects against eating up the CPU when long
      // placeables are deeply nested.
      throw new RangeError(`Too many placeables expanded: ${scope.placeables}, ` + `max allowed is ${MAX_PLACEABLES}`);
    }

    if (useIsolating) {
      result.push(FSI);
    }

    result.push(resolveExpression(scope, elem).toString(scope));

    if (useIsolating) {
      result.push(PDI);
    }
  }

  scope.dirty.delete(ptn);
  return result.join(' + ');
}

const translator: FluentTranslator = {
  functionNameMappings: {
    t: 't'
  },
  bundle: null,
  translate(translateExpression: TranslateExpression): TranslateResult {
    if (this.bundle == null) throw new Error('Bundle is null!');
    const bundle = this.bundle as FluentBundle;
    const paramsExpression = translateExpression.content
      .substring(translateExpression.content.search(/\(/) + 1, translateExpression.content.length - 1)
      .trim();
    const { result, rest } = extractKey(paramsExpression);
    const key = result.substring(1, result.length - 1);
    const params = extractParams(rest);
    const message = bundle.getMessage(key);
    if (message == null || message.value == null) {
      throw new Error(`Bundle does not have key ${key}`);
    }

    bundle._transform = function (str: string): string {
      return `'${str}'`;
    };

    // modify the bundle's formatPattern method so that we can use our own resolver
    bundle.formatPattern = function (
      pattern: Pattern,
      args: Record<string, FluentArgument> | null = null,
      errors: Array<Error> | null = null
    ): string {
      // Resolve a simple pattern without creating a scope. No error handling is
      // required; by definition simple patterns don't have placeables.
      if (typeof pattern === 'string') {
        return bundle._transform(pattern);
      }

      // Resolve a complex pattern.
      const scope = new Scope(this, errors, args);
      try {
        const value = resolveComplexPattern(scope, pattern);
        return value.toString(scope);
      } catch (err) {
        if (scope.errors) {
          scope.errors.push(err);
          return new FluentNone().toString(scope);
        }
        throw err;
      }
    };

    const content = bundle.formatPattern(message.value, params);

    return {
      optimized: false,
      content: content
    };
  }
};

export default translator;
