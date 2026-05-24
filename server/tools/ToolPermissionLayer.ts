export class ToolPermissionLayer {
  static allowedCommands = ["echo", "ls", "node --version", "pwd", "date", "cat"];
  static allowedDirs = ["/tmp/helix-sandbox"];

  static canExecuteCommand(cmd: string) {
    return this.allowedCommands.some(allowed => cmd.startsWith(allowed));
  }

  static assertPathIsSafe(path: string) {
    if (path.includes("..") || path.startsWith("/") && !this.allowedDirs.some(dir => path.startsWith(dir))) {
      throw new Error(`Path ${path} is outside allowed sandbox directories`);
    }
    return true;
  }
}
