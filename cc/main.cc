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

#include <sched.h>
#include <stdio.h>
#include <stdlib.h>
#include <cstdio>
#include <ctime>
#include <string>
#include <emscripten.h>
#include <emscripten/proxying.h>
#include "thread_utils.h"
#include <time.h>
#include <string.h>

extern "C" {

/*
 * Load some files using a proxy queue.
 *
 * Downloads all the files in the `url` list and stores their contents in a new
 * data array that it allocates. Sets the `data_ptr` to point to this new array.
 *
 * You must `free(*data_ptr)` when you're done with it.
 *
 * Sets `offsets` to the end of each file in *data_ptr. For example:
 *                      (offset = 0)
 *   file0: 5 bytes     (offset += 5)
 *   file1: 15 bytes    (offset += 15)
 *   file2: 10 bytes    (offset += 10)
 *
 *   offsets == {5, 20, 30}
 *   *data_ptr has length 30
 */
extern void load_with_proxy(em_proxying_ctx *ctx, uint32_t urls_count,
                            const char *url[], char **data_ptr,
                            uint32_t offsets[]);

extern void create_layers_model(em_proxying_ctx *ctx, const char *model_json,
                                void *weights, uint32_t weights_size,
                                uint32_t *model_id);

extern void predict(em_proxying_ctx *ctx, uint32_t model_id, const float *input,
                    uint32_t input_len, float **output, uint32_t *output_len);

int main() {
  // Create a ProxyWorker that will proxy function calls into pthreads.
  emscripten::ProxyWorker proxy;

  constexpr int url_count = 2;

  // Allocate a buffer for storing the model. There's probably a better way to
  // do this.
  char* data_ptr[] = {nullptr};

  // The offsets of each file loaded by load_with_proxy.
  uint32_t offsets[url_count];

  // These urls include the model.json file and the weights files.
  const char* urls[] = {
    "double_model/model.json\0",
    "double_model/weights.bin\0",
  };

  printf("Calling proxy\n");
  proxy([&](auto ctx) { load_with_proxy(ctx.ctx, url_count, urls, data_ptr, offsets); });
  printf("After proxy call\n");

  char* data = *data_ptr;

  // Copy the model json to a string
  printf("Allocating %d bytes for model.json\n", offsets[0] + 1);
  char* model_json_chars = (char*) calloc(offsets[0] + 1, sizeof(char));
  strncpy(model_json_chars, data, offsets[0]);
  model_json_chars[offsets[0]] = '\0'; // Null terminate the string.
  std::string model_json = model_json_chars;
  free(model_json_chars);

  // Get a pointer to the model weights files. They are already concatenated, so
  // no extra copying is required.
  char* model_weights = data + offsets[0];
  size_t model_weights_len = offsets[1] - offsets[0];

  // Create the layers model
  uint32_t model_id;
  proxy([&](auto ctx) {
    create_layers_model(ctx.ctx, model_json.c_str(), model_weights,
                        model_weights_len, &model_id);
  });

  printf("Created layers model with id %d\n", model_id);
  
  float input[] = {1,2,3,4};
  float *output;
  uint32_t output_len;
  printf("Calling model with input %f, %f, %f, %f\n", input[0], input[1], input[2],
         input[3]);
  proxy([&](auto ctx) {
    predict(ctx.ctx, model_id, input, 4, &output, &output_len);
  });

  printf("Got output %f, %f, %f, %f\n", output[0], output[1], output[2], output[3]);

  free(output);
  free(data);
  return 0;
}
}
