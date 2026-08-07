"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type NodeTypes,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import { DecisionNode } from "./decision-node";
import { ExecutionPanel } from "./execution-panel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import type {
  DecisionEdge,
  DecisionNode as DecisionNodeType,
  WorkflowGraph,
} from "@/types/workflow";

import type {
  ExecutionLog,
  ExecutionStatus,
} from "@/types/execution";

// ==================================================
// CONSTANTS
// ==================================================

const STORAGE_KEY = "ai-workflow-builder-graph";

const nodeTypes: NodeTypes = {
  decision: DecisionNode,
};

// ==================================================
// MOCK API RESPONSE TYPES
// ==================================================

type MockExecutionResult = {
  nodeId: string;
  nodeName: string;
  prompt: string;
  decision: "YES" | "NO";
  branchFollowed: "YES" | "NO" | null;
};

type MockExecutionResponse = {
  success: boolean;
  mode?: string;
  startNodeId?: string;
  executedNodes?: number;
  executionOrder?: MockExecutionResult[];
  error?: string;
};

// ==================================================
// INITIAL NODE
// ==================================================

const initialNodes: DecisionNodeType[] = [
  {
    id: "node-1",
    type: "decision",

    position: {
      x: 300,
      y: 150,
    },

    data: {
      label: "Support Check",
      prompt: "Is this a support request?",
    },
  },
];

// ==================================================
// WORKFLOW EDITOR
// ==================================================

export function WorkflowEditor() {
  // ------------------------------------------------
  // GRAPH STATE
  // ------------------------------------------------

  const [nodes, setNodes] =
    useState<DecisionNodeType[]>(initialNodes);

  const [edges, setEdges] =
    useState<DecisionEdge[]>([]);

  const [selectedNodeId, setSelectedNodeId] =
    useState<string | null>(null);

  const [isLoaded, setIsLoaded] =
    useState(false);

  // ------------------------------------------------
  // EXECUTION STATE
  // ------------------------------------------------

  const [isRunning, setIsRunning] =
    useState(false);

  const [runMessage, setRunMessage] =
    useState<string | null>(null);

  const [
    executionStatus,
    setExecutionStatus,
  ] = useState<ExecutionStatus>("idle");

  const [
    executionLogs,
    setExecutionLogs,
  ] = useState<ExecutionLog[]>([]);

  const [
    executionError,
    setExecutionError,
  ] = useState<string | undefined>(
    undefined
  );

  const hasLoadedRef = useRef(false);

  // ==================================================
  // LOAD WORKFLOW FROM LOCAL STORAGE
  // ==================================================

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    try {
      const savedWorkflow =
        localStorage.getItem(STORAGE_KEY);

      if (savedWorkflow) {
        const parsed: WorkflowGraph =
          JSON.parse(savedWorkflow);

        if (
          Array.isArray(parsed.nodes) &&
          Array.isArray(parsed.edges)
        ) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load workflow:",
        error
      );
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // ==================================================
  // SAVE WORKFLOW TO LOCAL STORAGE
  // ==================================================

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const workflow: WorkflowGraph = {
      nodes,
      edges,
    };

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(workflow)
      );
    } catch (error) {
      console.error(
        "Failed to save workflow:",
        error
      );
    }
  }, [nodes, edges, isLoaded]);

  // ==================================================
  // NODE CHANGES
  // ==================================================

  const onNodesChange = useCallback(
    (
      changes: NodeChange<DecisionNodeType>[]
    ) => {
      setNodes((currentNodes) =>
        applyNodeChanges(
          changes,
          currentNodes
        )
      );
    },
    []
  );

  // ==================================================
  // EDGE CHANGES
  // ==================================================

  const onEdgesChange = useCallback(
    (
      changes: EdgeChange<DecisionEdge>[]
    ) => {
      setEdges((currentEdges) =>
        applyEdgeChanges(
          changes,
          currentEdges
        )
      );
    },
    []
  );

  // ==================================================
  // CONNECT YES / NO PATHS
  // ==================================================

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.sourceHandle) {
        return;
      }

      if (
        connection.sourceHandle !== "YES" &&
        connection.sourceHandle !== "NO"
      ) {
        return;
      }

      // Prevent self-connections
      if (
        connection.source ===
        connection.target
      ) {
        return;
      }

      const decision =
        connection.sourceHandle;

      setEdges((currentEdges) => {
        // Only one YES and one NO edge
        // may leave each decision node.

        const alreadyExists =
          currentEdges.some(
            (edge) =>
              edge.source ===
                connection.source &&
              edge.sourceHandle ===
                connection.sourceHandle
          );

        if (alreadyExists) {
          return currentEdges;
        }

        const newEdge: DecisionEdge = {
          id: `edge-${crypto.randomUUID()}`,

          source: connection.source,

          target: connection.target,

          sourceHandle:
            connection.sourceHandle,

          targetHandle:
            connection.targetHandle,

          label: decision,

          data: {
            decision,
          },

          animated: true,

          style: {
            stroke:
              decision === "YES"
                ? "#16a34a"
                : "#dc2626",

            strokeWidth: 2,
          },

          labelStyle: {
            fill:
              decision === "YES"
                ? "#16a34a"
                : "#dc2626",

            fontWeight: 700,
          },
        };

        return addEdge(
          newEdge,
          currentEdges
        );
      });
    },
    []
  );

  // ==================================================
  // ADD NODE
  // ==================================================

  const addNode = useCallback(() => {
    const id = crypto.randomUUID();

    const newNode: DecisionNodeType = {
      id,

      type: "decision",

      position: {
        x: 250 + Math.random() * 300,
        y: 150 + Math.random() * 300,
      },

      data: {
        label: "New Decision",

        prompt:
          "Enter your decision prompt...",
      },
    };

    setNodes((currentNodes) => [
      ...currentNodes,
      newNode,
    ]);

    setSelectedNodeId(id);
  }, []);

  // ==================================================
  // UPDATE SELECTED NODE
  // ==================================================

  const updateSelectedNode = useCallback(
    (
      field: "label" | "prompt",
      value: string
    ) => {
      if (!selectedNodeId) {
        return;
      }

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (
            node.id !== selectedNodeId
          ) {
            return node;
          }

          return {
            ...node,

            data: {
              ...node.data,

              [field]: value,
            },
          };
        })
      );
    },
    [selectedNodeId]
  );

  // ==================================================
  // DELETE SELECTED NODE
  // ==================================================

  const deleteSelectedNode =
    useCallback(() => {
      if (!selectedNodeId) {
        return;
      }

      setNodes((currentNodes) =>
        currentNodes.filter(
          (node) =>
            node.id !== selectedNodeId
        )
      );

      setEdges((currentEdges) =>
        currentEdges.filter(
          (edge) =>
            edge.source !==
              selectedNodeId &&
            edge.target !==
              selectedNodeId
        )
      );

      setSelectedNodeId(null);
    }, [selectedNodeId]);

  // ==================================================
  // CLEAR WORKFLOW
  // ==================================================

  const clearWorkflow =
    useCallback(() => {
      if (isRunning) {
        return;
      }

      setNodes([]);

      setEdges([]);

      setSelectedNodeId(null);

      setRunMessage(null);

      setExecutionStatus("idle");

      setExecutionLogs([]);

      setExecutionError(undefined);

      localStorage.removeItem(
        STORAGE_KEY
      );
    }, [isRunning]);

  // ==================================================
  // RUN WORKFLOW
  // ==================================================

  const runWorkflow =
    useCallback(async () => {
      // ----------------------------------------------
      // PREVENT MULTIPLE RUNS
      // ----------------------------------------------

      if (isRunning) {
        return;
      }

      // ----------------------------------------------
      // VALIDATE NODES
      // ----------------------------------------------

      if (nodes.length === 0) {
        const message =
          "Add at least one decision node before running.";

        setRunMessage(message);

        setExecutionStatus("failed");

        setExecutionError(message);

        setExecutionLogs([
          {
            id: crypto.randomUUID(),
            message,
            status: "failed",
            timestamp:
              new Date().toLocaleTimeString(),
          },
        ]);

        return;
      }

      // ----------------------------------------------
      // VALIDATE NODE NAMES
      // ----------------------------------------------

      const emptyNameNode =
        nodes.find(
          (node) =>
            !node.data.label?.trim()
        );

      if (emptyNameNode) {
        const message =
          "Every decision node must have a name.";

        setRunMessage(message);

        setExecutionStatus("failed");

        setExecutionError(message);

        setExecutionLogs([
          {
            id: crypto.randomUUID(),
            message,
            status: "failed",
            timestamp:
              new Date().toLocaleTimeString(),
          },
        ]);

        return;
      }

      // ----------------------------------------------
      // VALIDATE PROMPTS
      // ----------------------------------------------

      const emptyPromptNode =
        nodes.find(
          (node) =>
            !node.data.prompt?.trim()
        );

      if (emptyPromptNode) {
        const message =
          `Node "${emptyPromptNode.data.label}" has an empty prompt.`;

        setRunMessage(message);

        setExecutionStatus("failed");

        setExecutionError(message);

        setExecutionLogs([
          {
            id: crypto.randomUUID(),
            nodeId: emptyPromptNode.id,
            nodeName:
              emptyPromptNode.data.label,
            message,
            status: "failed",
            timestamp:
              new Date().toLocaleTimeString(),
          },
        ]);

        return;
      }

      // ----------------------------------------------
      // START EXECUTION
      // ----------------------------------------------

      setIsRunning(true);

      setRunMessage(
        "Workflow is running..."
      );

      setExecutionStatus("running");

      setExecutionError(undefined);

      setExecutionLogs([
        {
          id: crypto.randomUUID(),

          message:
            "Workflow execution started.",

          status: "running",

          timestamp:
            new Date().toLocaleTimeString(),
        },
      ]);

      try {
        // ============================================
        // MOCK EXECUTION ENDPOINT
        // ============================================
        //
        // This endpoint is temporary while the
        // OpenAI account has no API credits.
        //
        // The real Inngest/OpenAI implementation
        // remains untouched.
        // ============================================

        const response = await fetch(
          "/api/workflow/mock-run",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              nodes,
              edges,
            }),
          }
        );

        const data: MockExecutionResponse =
          await response.json();

        // --------------------------------------------
        // API FAILURE
        // --------------------------------------------

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Workflow execution failed."
          );
        }

        // --------------------------------------------
        // GET EXECUTION RESULTS
        // --------------------------------------------

        const results =
          data.executionOrder ?? [];

        if (results.length === 0) {
          throw new Error(
            "Workflow completed without executing any nodes."
          );
        }

        // --------------------------------------------
        // SHOW NODE-BY-NODE EXECUTION
        // --------------------------------------------

        for (const result of results) {
          // Node decision log

          const decisionLog: ExecutionLog =
            {
              id: crypto.randomUUID(),

              nodeId: result.nodeId,

              nodeName:
                result.nodeName,

              message:
                `AI decision: ${result.decision}`,

              decision:
                result.decision,

              status: "success",

              timestamp:
                new Date().toLocaleTimeString(),
            };

          setExecutionLogs(
            (currentLogs) => [
              ...currentLogs,
              decisionLog,
            ]
          );

          // Small visual delay

          await new Promise<void>(
            (resolve) => {
              window.setTimeout(
                resolve,
                300
              );
            }
          );

          // ------------------------------------------
          // BRANCH LOG
          // ------------------------------------------

          if (
            result.branchFollowed
          ) {
            const branchLog: ExecutionLog =
              {
                id: crypto.randomUUID(),

                nodeId:
                  result.nodeId,

                nodeName:
                  result.nodeName,

                message:
                  `Following ${result.branchFollowed} path.`,

                decision:
                  result.branchFollowed,

                status: "success",

                timestamp:
                  new Date().toLocaleTimeString(),
              };

            setExecutionLogs(
              (currentLogs) => [
                ...currentLogs,
                branchLog,
              ]
            );
          } else {
            const terminalLog: ExecutionLog =
              {
                id: crypto.randomUUID(),

                nodeId:
                  result.nodeId,

                nodeName:
                  result.nodeName,

                message:
                  "End of workflow path reached.",

                status: "success",

                timestamp:
                  new Date().toLocaleTimeString(),
              };

            setExecutionLogs(
              (currentLogs) => [
                ...currentLogs,
                terminalLog,
              ]
            );
          }

          await new Promise<void>(
            (resolve) => {
              window.setTimeout(
                resolve,
                200
              );
            }
          );
        }

        // ============================================
        // SUCCESS
        // ============================================

        const executedCount =
          data.executedNodes ??
          results.length;

        const successMessage =
          `Workflow completed successfully. ${executedCount} node(s) executed.`;

        setExecutionLogs(
          (currentLogs) => [
            ...currentLogs,

            {
              id: crypto.randomUUID(),

              message:
                successMessage,

              status: "success",

              timestamp:
                new Date().toLocaleTimeString(),
            },
          ]
        );

        // IMPORTANT:
        // ExecutionStatus uses "success",
        // not "completed".

        setExecutionStatus(
          "success"
        );

        setExecutionError(
          undefined
        );

        setRunMessage(
          successMessage
        );
      } catch (error) {
        // ============================================
        // ERROR HANDLING
        // ============================================

        console.error(
          "Workflow execution error:",
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : "Workflow execution failed.";

        setExecutionStatus(
          "failed"
        );

        setExecutionError(
          message
        );

        setRunMessage(
          message
        );

        setExecutionLogs(
          (currentLogs) => [
            ...currentLogs,

            {
              id: crypto.randomUUID(),

              message,

              status: "failed",

              timestamp:
                new Date().toLocaleTimeString(),
            },
          ]
        );
      } finally {
        // Always leave Running state

        setIsRunning(false);
      }
    }, [
      nodes,
      edges,
      isRunning,
    ]);

  // ==================================================
  // SELECTED NODE
  // ==================================================

  const selectedNode =
    nodes.find(
      (node) =>
        node.id === selectedNodeId
    ) ?? null;

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="flex h-[calc(100vh-80px)] w-full">
      {/* ============================================
          WORKFLOW CANVAS
      ============================================ */}

      <div className="relative min-w-0 flex-1">
        {/* TOOLBAR */}

        <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
          <div className="flex gap-2">
            <Button
              onClick={addNode}
              disabled={isRunning}
            >
              + Add Decision
            </Button>

            <Button
              variant="outline"
              onClick={clearWorkflow}
              disabled={isRunning}
            >
              Clear
            </Button>

            <Button
              onClick={runWorkflow}
              disabled={isRunning}
            >
              {isRunning
                ? "Running..."
                : "▶ Run Workflow"}
            </Button>
          </div>

          {/* RUN MESSAGE */}

          {runMessage && (
            <div className="max-w-md rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
              {runMessage}
            </div>
          )}
        </div>

        {/* REACT FLOW */}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={
            onNodesChange
          }
          onEdgesChange={
            onEdgesChange
          }
          onConnect={onConnect}
          onNodeClick={(_, node) => {
            setSelectedNodeId(
              node.id
            );
          }}
          onPaneClick={() => {
            setSelectedNodeId(null);
          }}
          fitView
        >
          <Background />

          <Controls />

          <MiniMap />
        </ReactFlow>
      </div>

      {/* ============================================
          NODE PROPERTIES PANEL
      ============================================ */}

      <aside className="w-80 shrink-0 overflow-y-auto border-l bg-background p-5">
        <h2 className="text-lg font-semibold">
          Node Properties
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Configure the selected AI
          decision.
        </p>

        <Separator className="my-5" />

        {!selectedNode ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Select a node from the canvas
            to edit it.
          </div>
        ) : (
          <div className="space-y-5">
            {/* NODE NAME */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Node Name
              </label>

              <Input
                value={
                  selectedNode.data.label
                }
                onChange={(event) =>
                  updateSelectedNode(
                    "label",
                    event.target.value
                  )
                }
                disabled={isRunning}
              />
            </div>

            {/* AI PROMPT */}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                AI Prompt
              </label>

              <Textarea
                value={
                  selectedNode.data.prompt
                }
                onChange={(event) =>
                  updateSelectedNode(
                    "prompt",
                    event.target.value
                  )
                }
                rows={6}
                disabled={isRunning}
              />

              <p className="text-xs text-muted-foreground">
                The AI evaluates this
                prompt and must return
                either YES or NO.
              </p>
            </div>

            <Separator />

            {/* NODE ID */}

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Node ID
              </p>

              <code className="block break-all rounded bg-muted p-2 text-xs">
                {selectedNode.id}
              </code>
            </div>

            {/* DELETE NODE */}

            <Button
              variant="destructive"
              className="w-full"
              onClick={
                deleteSelectedNode
              }
              disabled={isRunning}
            >
              Delete Node
            </Button>
          </div>
        )}
      </aside>

      {/* ============================================
          EXECUTION LOGS PANEL
      ============================================ */}

      <aside className="w-96 shrink-0 overflow-y-auto border-l bg-background p-5">
        <ExecutionPanel
          status={
            executionStatus
          }
          logs={executionLogs}
          error={executionError}
        />
      </aside>
    </div>
  );
}