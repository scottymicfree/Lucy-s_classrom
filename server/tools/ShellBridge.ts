import { ToolPermissionLayer } from "./ToolPermissionLayer";
import { exec } from "child_process";

export class ShellBridge {
  static async execute(command: string): Promise<string> {
    if (!ToolPermissionLayer.canExecuteCommand(command)) {
      throw new Error(`Command blocked by ToolPermissionLayer: ${command}`);
    }

    return new Promise((resolve, reject) => {
      exec(command, { timeout: 5000 }, (err, stdout, stderr) => {
        if (err) reject(err);
        else resolve(stdout ? stdout.trim() : stderr.trim());
      });
    });
  }
}
