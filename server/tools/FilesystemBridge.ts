import { ToolPermissionLayer } from "./ToolPermissionLayer";
import fs from "fs";

export class FilesystemBridge {
  static read(filepath: string) {
    ToolPermissionLayer.assertPathIsSafe(filepath);
    if (fs.existsSync(filepath)) {
      return fs.readFileSync(filepath, "utf8");
    }
    return null;
  }

  static write(filepath: string, content: string) {
    ToolPermissionLayer.assertPathIsSafe(filepath);
    fs.writeFileSync(filepath, content, "utf8");
  }
}
