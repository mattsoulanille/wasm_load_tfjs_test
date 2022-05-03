#include <stdio.h>
#include <ctime>
#include <string>
#include <emscripten.h>
#include <time.h>


EM_JS(void, call_alert, (), {
  alert('hello, world!');
  //throw 'all done';
});

EM_JS(void, load_model, (), {
    const modelUrl =
      "https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json";
    console.log("Loading model");
    self.model = tf.loadGraphModelSync(tf.io.httpSync(modelUrl));
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

/*
EM_ASYNC_JS(int, do_fetch, (), {
  const modelUrl =
    "https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json";
  const model = await tf.loadGraphModel(modelUrl);
  const zeros = tf.zeros([1, 224, 224, 3]);
  model.predict(zeros).print();
  return 42;
});
*/

extern "C" {

EMSCRIPTEN_KEEPALIVE
int add(int a, int b) {
  return a + b;
}

int main() {
  printf("Hello, world! %d\n", add(4, 5));
  load_model();
  printf("finished running load_model\n");
  run_model();
  printf("finished running run_model\n");

  double a = 0;
  double b = 1;

  double start = emscripten_get_now();
  while (a < 22) {
    // for (int x = 1; x < 3; x++) {
    printf("num: %f\n", a);
    //emscripten_sleep(1);
    for (int i = 0; i < 50000000; i++) {
      a += 1 / b;
      b++;
    }
  }
  double end = emscripten_get_now();
  double seconds = (end - start) / 1000;
  printf("Seconds taken for loop: %f\n", seconds);

  return 0;
}

}
