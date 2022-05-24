/**
 * @license
 * Copyright 2022 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import {Init} from 'main_wasm';
import * as tf from '@tensorflow/tfjs';
import {httpSync} from './http_sync';

// Make tf available to wasm by setting it on the global object.
// There's almost certainly a better way to do this, but this is simple.
(globalThis as any)['tf'] = tf;
// Make httpSync available to wasm.
(globalThis as any)['httpSync'] = httpSync;
(globalThis as any)['MainWasm'] = Init;

async function main() {
  // Load wasm by running its Init function, which runs main().
  await Init({});
}

// The javascript main() function, not related to wasm.
main();
