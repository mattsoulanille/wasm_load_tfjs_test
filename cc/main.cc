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

#include <stdio.h>
#include <ctime>
#include <string>
#include <emscripten.h>
#include <emscripten/proxying.h>
#include "thread_utils.h"
#include <time.h>

extern "C" {

extern void load_with_proxy(em_proxying_ctx* ctx, const char* url, void* data, uint32_t max_len, uint32_t* received_len);

int main() {
  // Create a ProxyWorker that will proxy function calls into pthreads.
  emscripten::ProxyWorker proxy;

  // Allocate a buffer for storing the model. There's probably a better way to
  // do this.
  uint32_t max_len = 200000;
  char data[max_len];
  uint32_t received_len; // load_with_proxy will tell us how long the file
                         // actually is.

  // Load the model file.
  // https://github.com/emscripten-core/emscripten/blob/main/system/lib/wasmfs/backends/opfs_backend.cpp#L134
  proxy([&](auto ctx) { load_with_proxy(ctx.ctx, "https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json", &data, max_len, &received_len); });

  // Add null termination to the char array to make it a string.
  data[received_len] = '\0';
  printf("After proxy call\n");
  printf("Got %d bytes\n", received_len);
  printf("Data:\n%s\n", data);

  return 0;
}

}
