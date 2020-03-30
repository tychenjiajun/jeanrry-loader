import webpack from 'webpack';

export default function getCodeFromStats(stats: webpack.Stats): string {
  return JSON.parse(stats.toJson().modules[0].source.substr(15)).vue;
}
