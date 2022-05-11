import {Init} from 'main_wasm';
import * as tf from '@tensorflow/tfjs';
//import {BufferBackedObject} from 'buffer-backed-object';
//import * as Comlink from 'comlink';

// Make tf available to wasm
(window as any)['tf'] = tf;

async function main() {
  const MainWasm = await Init({
    locateFile: (f: string) => `cc/main_wasm/${f}`
  });
//  const worker = new Worker('worker_bundle.js');
//  const MainWasm = Comlink.wrap(worker) as any;

  const sab = new SharedArrayBuffer(1000);
  const worker = new Worker('worker_bundle.js');
  const modelUrl = "https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json";
  const encoder = new TextEncoder();
  encoder.encode(modelUrl);
  worker.postMessage(sab);



  console.log(MainWasm._add(4, 5));
}

main();
