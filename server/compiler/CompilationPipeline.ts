import { compileWasm } from "./DynamicWasmBuilder";
import { registerModule } from "./WasmModuleRegistry";

export class CompilationPipeline {
  static listeners: Array<(event: any) => void> = [];

  static onEvent(callback: (event: any) => void) {
    this.listeners.push(callback);
  }

  private static broadcast(event: any) {
    this.listeners.forEach(cb => cb(event));
  }

  static async compile(objective: string, specialization: string) {
    const startObj = { type: "compilation_started", objective, specialization };
    this.broadcast(startObj);

    const { buffer, source } = await compileWasm(objective, specialization);
    const modInfo = registerModule(specialization, buffer, source);

    this.broadcast({
      type: "wasm_compiled",
      moduleId: modInfo.moduleId,
      specialization,
      details: { size: buffer.length }
    });

    return modInfo;
  }
}
