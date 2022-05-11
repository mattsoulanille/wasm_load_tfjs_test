//import * as Comlink from 'comlink';
//import {Init} from 'main_wasm';
import * as tf from '@tensorflow/tfjs';

// Make tf available to wasm
(self as any)['tf'] = tf;

function getSab(): Promise<SharedArrayBuffer> {
  return new Promise((resolve) => {
    addEventListener('message', event => {
      console.log(event);
      resolve(event.data as SharedArrayBuffer);
    });
  });
}


(async () => {
  const sab = await getSab();
  console.log(sab);
  const uint8Array = new Uint8Array(sab);
  const int32Array = new Int32Array(sab);
  const dv = new DataView(sab);
  const decoder = new TextDecoder();
  const url = decoder.decode(uint8Array.slice(100, dv.getUint32(50) + 100));
  console.log(url);

  const response = await fetch(url);
  const data = await response.arrayBuffer();
  const dataUint8 = new Uint8Array(data);

  uint8Array.set(dataUint8, 2000);
  int32Array[1] = dataUint8.length;
  Atomics.notify(int32Array, 0);
//  int32Array[0] = 1;

  // const MainWasm = await Init({
  //   locateFile: (f: string) => `cc/main_wasm/${f}`
  // });

  //Comlink.expose(MainWasm);
})();
