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
#include <time.h>

EM_JS(void, load_model, (), {
    const modelUrl =
      "https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json";
    console.log("Loading model");
    self.model = tf.loadGraphModelSync(httpSync(modelUrl));
    console.log("Loaded model");
});

EM_JS(void, run_model, (), {
    console.log("Running model");
    const model = self.model;
    const zeros = tf.zeros([1, 224, 224, 3]);
    const result = model.predict(zeros);
    result.print();
    console.log("Ran model");
});

extern "C" {

int main() {
  printf("Loading model\n");
  load_model();
  printf("finished running load_model\n");
  run_model();
  printf("finished running run_model\n");

  return 0;
}

}
