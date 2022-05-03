import {Init} from 'main_wasm';
import * as tf from '@tensorflow/tfjs';
//import * as Comlink from 'comlink';

// Make tf available to wasm
(window as any)['tf'] = tf;

async function main() {
  const MainWasm = await Init({
    locateFile: (f: string) => `cc/main_wasm/${f}`
  });
//  const worker = new Worker('worker_bundle.js');
//  const MainWasm = Comlink.wrap(worker) as any;

  console.log(MainWasm._add(4, 5));
}

main();
