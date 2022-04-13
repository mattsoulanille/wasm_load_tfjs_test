//export * from "./main_wasm/main";
//export * as MainWasm from "./main_wasm/main";
//export default MainWasm = Module.default();

import * as Wasm from "./main_wasm/main";
export const Init = Wasm.default;
