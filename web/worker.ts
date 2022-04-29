import * as Comlink from 'comlink';
import {Init} from 'main_wasm';
import * as tf from '@tensorflow/tfjs';

// Make tf available to wasm
(self as any)['tf'] = tf;

(async () => {
  const MainWasm = await Init({
    locateFile: (f: string) => `cc/main_wasm/${f}`
  });

  Comlink.expose(MainWasm);
})();
