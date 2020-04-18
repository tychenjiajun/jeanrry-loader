import webpack from 'webpack';

export default function getCodeFromStats(stats: webpack.Stats): string {
  if (stats.toJson().errors && stats.toJson().errors.length > 0) {
    console.log(stats.toJson().errors);
  }
  return JSON.parse(stats.toJson().modules[0].source.substr(15)).vue;
}
