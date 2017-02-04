import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';

export default {
  moduleName: 'game',
  entry: 'src/game.js',
  plugins: [
    buble()//,
    //uglify()
  ],
  dest: 'dist/game.js'
};
