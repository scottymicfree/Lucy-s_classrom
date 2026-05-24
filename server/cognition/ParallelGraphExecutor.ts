import { RuntimeThreadPool } from "../runtime/RuntimeThreadPool";

export class ParallelGraphExecutor {
  static async executeBranches(branches: any[]) {
    const promises = branches.map(async branch => {
       const threadId = await RuntimeThreadPool.allocateThread();
       return RuntimeThreadPool.execute(threadId, branch);
    });
    return Promise.all(promises);
  }
}
