import path from 'path';
import webpack from 'webpack';
import { createFsFromVolume, Volume } from 'memfs';
import * as kiss from 'frenchkiss';

kiss.set('en', {
  hi: 'Hi',
  hello: 'Hello, {name}!',
  welcome: 'Welcome to Your {name} App!'
});

kiss.locale('en');

export default (fixture, options = {}): Promise<webpack.Stats> => {
  const compiler = webpack({
    context: __dirname,
    entry: `../from/${fixture}.vue?vue&type=template&i18n=true`, // faking a query
    output: {
      path: path.resolve(__dirname),
      filename: 'bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          use: [{ loader: path.resolve(__dirname, './vue-loader.ts') }]
        },
        {
          test: /\.vue$/,
          resourceQuery: /\?vue.*(&type=template){1}.*(&i18n){1}.*$/,
          use: [
            {
              loader: path.resolve(__dirname, '../../src/index.ts'),
              options: options
            }
          ]
        }
      ]
    }
  });

  const vol = new Volume();

  const fs = createFsFromVolume(vol);

  compiler.outputFileSystem = {
    join: path.join,
    mkdir: vol.mkdir,
    mkdirp: vol.mkdirp,
    rmdir: vol.rmdir,
    unlink: vol.unlink,
    writeFile: vol.writeFile,
    ...fs
  };

  return new Promise((resolve: (value: webpack.Stats) => void, reject) => {
    compiler.run((err, stats) => {
      if (err) reject(err);
      resolve(stats);
    });
  });
};
