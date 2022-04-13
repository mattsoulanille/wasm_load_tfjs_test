#include <stdio.h>
#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

extern "C" {

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
int add(int a, int b) {
  return a + b;
}

int main() {
  printf("Hello, world! %d\n", add(4, 5));
  return 0;
}

}
