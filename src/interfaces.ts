interface TranslateFunction {
  (translateExpression: TranslateExpression): TranslateResult;
}

export interface TranslateResult {
  optimized: boolean;
  content: string;
}

export interface FunctionNameMappings {
  [name: string]: string;
}

export interface Translator {
  functionNameMappings: FunctionNameMappings;
  translate: TranslateFunction;
}

export interface LoaderOption {
  translator?: Translator;
}

export interface TranslateExpression extends Expression {
  functionName: string;
}

export interface Expression {
  begin: number;
  end: number;
  content: string;
  type: ExpressionType;
}

export enum ExpressionType {
  text,
  attr
}
