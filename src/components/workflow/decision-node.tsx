"use client";

import {
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";

import { Badge } from "@/components/ui/badge";

import type {
  DecisionNode as DecisionNodeType,
} from "@/types/workflow";

export function DecisionNode({
  data,
  selected,
}: NodeProps<DecisionNodeType>) {
  return (
    <div
      className={`relative w-72 rounded-xl border bg-background p-4 shadow-md transition ${
        selected ? "ring-2 ring-primary" : ""
      }`}
    >
      {/* Incoming connection */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-background !bg-slate-500"
      />

      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            AI DECISION
          </p>

          <h3 className="font-semibold">
            {data.label}
          </h3>
        </div>

        <Badge variant="secondary">
          AI
        </Badge>
      </div>

      {/* Prompt */}
      <div className="rounded-md bg-muted p-3 text-sm">
        {data.prompt || "No prompt configured"}
      </div>

      {/* Branch labels */}
      <div className="mt-5 flex justify-around text-xs font-semibold">
        <span className="text-green-600">
          YES
        </span>

        <span className="text-red-600">
          NO
        </span>
      </div>

      {/* YES output */}
      <Handle
        id="YES"
        type="source"
        position={Position.Bottom}
        style={{
          left: "30%",
          background: "#16a34a",
          width: 12,
          height: 12,
        }}
      />

      {/* NO output */}
      <Handle
        id="NO"
        type="source"
        position={Position.Bottom}
        style={{
          left: "70%",
          background: "#dc2626",
          width: 12,
          height: 12,
        }}
      />
    </div>
  );
}