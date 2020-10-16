import commonjs from '@rollup/plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import typescript from '@rollup/plugin-typescript';
import { terser } from "rollup-plugin-terser";

const plugins = [
  commonjs(),
  filesize(),
  terser(),
  typescript({
    allowSyntheticDefaultImports: true
  })
];

export default [
  {
    external: [
      'child_process',
      'os',
      'vscode'
    ],
    input: './src/index.ts',
    output: {
      file: './lib/extension.js',
      format: 'cjs'
    },
    plugins: plugins
  }
];
