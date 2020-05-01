export function extractKey(expression: string): { result: string; rest: string } {
  if (expression.trim().length === 0) throw new Error('Key is required!');
  if ([...expression.matchAll(/['"`]/g)].length < 2) throw new Error('Key should be a string!');
  let p = 0;
  let stringType = '';

  function extract(expression: string, p: number): { result: string; rest: string } {
    let rest = expression.substring(p + 1).trim();
    if (rest.length > 0 && rest.charAt(0) === ',') rest = rest.substr(1);
    return {
      result: expression.substring(0, p + 1).trim(),
      rest: rest
    };
  }

  for (; p < expression.length; p++) {
    const char = expression.charAt(p);
    if (char === ',' && stringType === '') {
      throw new Error('Key is required!');
    }
    if (char === stringType) {
      return extract(expression, p);
    }
    if (char.match(/['"`]/)) {
      stringType = char;
    }
  }
  throw new Error('Key is required!');
}
