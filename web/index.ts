import {Init} from "main_wasm";

async function main() {
  const MainWasm = await Init({
    locateFile: (f: string) => `cc/main_wasm/${f}`
  });
  console.log(MainWasm);
  console.log(MainWasm._add(4, 5));
}

main();
