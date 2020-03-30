// faking a vue-loader to cheat the plugin
export default function testLoader(content): string {
  const result = { vue: content };
  return `export default ${JSON.stringify(result)}`;
}
