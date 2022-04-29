import {Init} from 'main_wasm';
import * as tf from '@tensorflow/tfjs';
//import * as Comlink from 'comlink';

// Make tf available to wasm
(window as any)['tf'] = tf;
const modelUrl =
  "https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json";

// async function loadModel() {
//   return tf.loadGraphModel(modelUrl);
// }

async function main() {
  //const modelData = await tf.io.http(modelUrl).load();
  //(self as any).modelData = modelData;
  const model = tf.loadGraphModelSync(tf.io.httpSync(modelUrl));
  (self as any).model = model;
  //tf.io.fromMemorySync(modelData));


  const MainWasm = await Init({
    locateFile: (f: string) => `cc/main_wasm/${f}`
  });

//  const worker = new Worker('worker_bundle.js');
//  const MainWasm = Comlink.wrap(worker) as any;

  console.log(MainWasm);
  console.log(MainWasm._add(4, 5));
  //MainWasm._main();
  //MainWasm._alert();
}

main();
