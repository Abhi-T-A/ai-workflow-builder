"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import type {
  ExecutionLog,
  ExecutionStatus,
} from "@/types/execution";

type ExecutionPanelProps = {
  status: ExecutionStatus;
  logs: ExecutionLog[];
  error?: string;
};

export function ExecutionPanel({
  status,
  logs,
  error,
}: ExecutionPanelProps) {
  const getStatusLabel = () => {
    switch (status) {
      case "running":
        return "Running";

      case "success":
        return "Success";

      case "failed":
        return "Failed";

      default:
        return "Idle";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          Execution Logs
        </CardTitle>

        <Badge variant="outline">
          {getStatusLabel()}
        </Badge>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[420px] pr-4">
          {logs.length === 0 && !error ? (
            <div className="text-sm text-muted-foreground">
              No workflow execution yet.
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">
                      {log.nodeName ??
                        "Workflow"}
                    </div>

                    {log.decision && (
                      <Badge
                        variant={
                          log.decision === "YES"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {log.decision}
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {log.message}
                  </p>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {log.timestamp}
                  </p>
                </div>
              ))}

              {error && (
                <div className="rounded-lg border border-destructive p-3">
                  <div className="font-medium text-destructive">
                    Execution Failed
                  </div>

                  <p className="mt-1 text-sm text-destructive">
                    {error}
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}