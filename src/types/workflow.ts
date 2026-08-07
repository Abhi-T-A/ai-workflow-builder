import type { Edge, Node } from "@xyflow/react";

export type Decision = "YES" | "NO";

export type DecisionNodeData = {
  label: string;
  prompt: string;
};

export type DecisionNode = Node<DecisionNodeData, "decision">;

export type DecisionEdgeData = {
  decision: Decision;
};

export type DecisionEdge = Edge<DecisionEdgeData>;

export type WorkflowGraph = {
  nodes: DecisionNode[];
  edges: DecisionEdge[];
};