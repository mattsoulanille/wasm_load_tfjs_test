import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
  output: {
    format: 'iife',
    sourcemap: true,
  },
  plugins: [
    nodeResolve({browser: true}),
    commonjs({ignore: ['fs', 'path']}),
    sourcemaps(),
  ],
  external: ['path', 'fs'],
};
