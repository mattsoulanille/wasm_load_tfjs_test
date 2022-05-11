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
  // const MainWasm = await Init({
  //   locateFile: (f: string) => `cc/main_wasm/${f}`
  // });

  //Comlink.expose(MainWasm);
})();
