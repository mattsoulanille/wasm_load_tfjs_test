import {Init} from 'main_wasm';
import * as tf from '@tensorflow/tfjs';
import {httpSync} from './http_sync';
//import * as Comlink from 'comlink';

// Make tf available to wasm
(window as any)['tf'] = tf;
// Same with http_sync
(window as any)['httpSync'] = httpSync;
const modelUrl =
  "https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json";
console.log(tf.loadGraphModelSync(httpSync(modelUrl)));

async function main() {
  const MainWasm = await Init({
    locateFile: (f: string) => `cc/main_wasm/${f}`
  });
//  const worker = new Worker('worker_bundle.js');
//  const MainWasm = Comlink.wrap(worker) as any;

  console.log(MainWasm._add(4, 5));
}

main();
