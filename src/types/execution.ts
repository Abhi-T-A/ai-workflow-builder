export type ExecutionStatus =
  | "idle"
  | "running"
  | "success"
  | "failed";

export type ExecutionLog = {
  id: string;
  nodeId?: string;
  nodeName?: string;
  message: string;
  decision?: "YES" | "NO";
  status: ExecutionStatus;
  timestamp: string;
};

export type WorkflowExecution = {
  status: ExecutionStatus;
  logs: ExecutionLog[];
  error?: string;
};