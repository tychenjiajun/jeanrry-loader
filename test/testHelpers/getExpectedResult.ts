import path from 'path';
import fs from 'fs';

export default function getExpectedResult(name): string {
  return fs.readFileSync(path.resolve(__dirname, `../to/${name}.vue`), 'utf8');
}
