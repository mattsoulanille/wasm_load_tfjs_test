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

  // For testing purposes, allocate a large buffer
  const sab = new SharedArrayBuffer(1e8);
  const worker = new Worker('worker_bundle.js');
  const modelUrl = "https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json";
  const encoder = new TextEncoder();
  const urlEncoded = encoder.encode(modelUrl);
  const dv = new DataView(sab);
  const uint8Array = new Uint8Array(sab);
  uint8Array.set(urlEncoded, 100);
  dv.setUint32(50, urlEncoded.length);
  worker.postMessage(sab);

  const int32Array = new Int32Array(sab);

  /*
  while (true) {
//    if (Atomics.load(int32Array, 0) === 1) {
    if (int32Array[0] === 1) {
      break;
    }
    //Atomics.wait(int32Array, 0, 1);
  }
  */
  console.log('waiting for response');
  await (Atomics as any).waitAsync(int32Array, 0, 0).value;
  console.log('got response');
  const fileData = uint8Array.slice(2000, int32Array[1] + 2000);
  const expectedData = await (await fetch(modelUrl)).arrayBuffer();
  const fileDataUint8 = new Uint8Array(fileData);
  const expectedDataUint8 = new Uint8Array(expectedData);

  for (let i = 0; i < expectedDataUint8.length; i++) {
    if (fileDataUint8[i] !== expectedDataUint8[i]) {
      throw new Error(`${fileDataUint8[i]} != ${expectedDataUint8[i]}`);
    }
  }
  console.log('Loaded the same data');


  console.log(MainWasm._add(4, 5));
}

main();
