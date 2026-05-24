import { FilesystemBridge } from "./FilesystemBridge";
import { ShellBridge } from "./ShellBridge";

export class SandboxManager {
  static listeners: Array<(event: any) => void> = [];

  static onEvent(callback: (event: any) => void) {
    this.listeners.push(callback);
  }

  static async invokeTool(toolName: string, args: any) {
    try {
      let result = null;
      if (toolName === "shell") {
        result = await ShellBridge.execute(args.command);
      } else if (toolName === "fs_read") {
        result = FilesystemBridge.read(args.path);
      } else {
        throw new Error("Unknown tool: " + toolName);
      }

      this.listeners.forEach(cb => cb({ type: "tool_execution", tool: toolName, status: "success", args }));
      return result;
    } catch (e: any) {
      this.listeners.forEach(cb => cb({ type: "tool_execution", tool: toolName, status: "blocked", error: e.message }));
      throw e;
    }
  }
}
