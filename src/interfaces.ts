interface TranslateFunction {
  (expression: string): string;
}

export interface FunctionNameMappings {
  [k: string]: 't' | 'te' | 'td' | 'n' | 'd';
}

export interface Translator {
  t?: TranslateFunction;
  te?: TranslateFunction;
  td?: TranslateFunction;
  n?: TranslateFunction;
  d?: TranslateFunction;
  mappings: {
    [k: string]: 't' | 'te' | 'td' | 'n' | 'd';
  };
}

export interface LoaderOption {
  translator?: Translator;
}

export interface TranslateExpression {
  start: number;
  end: number;
  content: string;
  functionName: 't' | 'te' | 'td' | 'n' | 'd';
}
