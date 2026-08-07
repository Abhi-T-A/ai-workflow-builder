import OpenAI from "openai";
import { inngest } from "./client";

// ==================================================
// TYPES
// ==================================================

type Decision = "YES" | "NO";

type WorkflowNode = {
  id: string;
  data: {
    label: string;
    prompt: string;
  };
};

type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;

  data?: {
    decision?: Decision;
  };
};

type ExecutionLog = {
  order: number;
  nodeId: string;
  nodeName: string;
  prompt: string;
  decision: Decision;
};

// ==================================================
// OPENAI
// ==================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ==================================================
// INNGEST FUNCTION
// ==================================================

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-ai-workflow",

    triggers: {
      event: "workflow/execute",
    },

    retries: 2,
  },

  async ({ event, step }) => {
    // ------------------------------------------------
    // GET GRAPH
    // ------------------------------------------------

    const nodes: WorkflowNode[] =
      event.data.nodes as WorkflowNode[];

    const edges: WorkflowEdge[] =
      event.data.edges as WorkflowEdge[];

    // ------------------------------------------------
    // STEP 1 — VALIDATE WORKFLOW
    // ------------------------------------------------

    await step.run(
      "validate-workflow",

      async (): Promise<{
        nodeCount: number;
        edgeCount: number;
        valid: boolean;
      }> => {
        if (
          !Array.isArray(nodes) ||
          nodes.length === 0
        ) {
          throw new Error(
            "Workflow contains no nodes."
          );
        }

        if (!Array.isArray(edges)) {
          throw new Error(
            "Workflow edges are invalid."
          );
        }

        return {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          valid: true,
        };
      }
    );

    // ------------------------------------------------
    // STEP 2 — FIND START NODE
    // ------------------------------------------------

    const startNode: WorkflowNode =
      await step.run(
        "find-start-node",

        async (): Promise<WorkflowNode> => {
          const targetNodeIds: Set<string> =
            new Set(
              edges.map(
                (edge: WorkflowEdge) =>
                  edge.target
              )
            );

          const startNodes: WorkflowNode[] =
            nodes.filter(
              (node: WorkflowNode) =>
                !targetNodeIds.has(node.id)
            );

          if (startNodes.length === 0) {
            throw new Error(
              "No start node found. The workflow may contain a cycle."
            );
          }

          if (startNodes.length > 1) {
            throw new Error(
              "Workflow has multiple start nodes. Connect the workflow so there is only one start node."
            );
          }

          return startNodes[0];
        }
      );

    // ------------------------------------------------
    // EXECUTION STATE
    // ------------------------------------------------

    const executionLog: ExecutionLog[] = [];

    const visitedNodeIds: Set<string> =
      new Set<string>();

    let currentNode: WorkflowNode | undefined =
      startNode;

    let executionOrder = 1;

    // ------------------------------------------------
    // STEP 3 — TRAVERSE GRAPH
    // ------------------------------------------------

    while (currentNode !== undefined) {
      /*
       * Explicit annotation is important here.
       * It also gives the async callback below a
       * stable snapshot of the current node.
       */
      const node: WorkflowNode = currentNode;

      // ----------------------------------------------
      // CYCLE CHECK
      // ----------------------------------------------

      if (visitedNodeIds.has(node.id)) {
        throw new Error(
          `Cycle detected at node "${node.data.label}".`
        );
      }

      visitedNodeIds.add(node.id);

      // ----------------------------------------------
      // AI DECISION
      // ----------------------------------------------

      const decision: Decision =
        await step.run(
          `decision-${node.id}`,

          async (): Promise<Decision> => {
            const prompt: string =
              node.data.prompt?.trim() ?? "";

            if (!prompt) {
              throw new Error(
                `Node "${node.data.label}" has an empty prompt.`
              );
            }

            const response =
              await openai.responses.create({
                model: "gpt-4.1-mini",

                instructions: `
You are a binary decision engine.

Evaluate the user's question.

Return exactly one value:

YES
NO

Do not provide an explanation.
Do not use markdown.
Do not add punctuation.
Do not return any additional text.
                `.trim(),

                input: prompt,
              });

            const answer: string =
              response.output_text
                .trim()
                .toUpperCase();

            if (
              answer !== "YES" &&
              answer !== "NO"
            ) {
              throw new Error(
                `AI returned invalid decision "${answer}". Expected YES or NO.`
              );
            }

            return answer as Decision;
          }
        );

      // ----------------------------------------------
      // RECORD EXECUTION
      // ----------------------------------------------

      const logEntry: ExecutionLog = {
        order: executionOrder,
        nodeId: node.id,
        nodeName: node.data.label,
        prompt: node.data.prompt,
        decision,
      };

      executionLog.push(logEntry);

      executionOrder++;

      // ----------------------------------------------
      // FIND MATCHING EDGE
      // ----------------------------------------------

      const selectedEdge:
        | WorkflowEdge
        | undefined = edges.find(
        (
          edge: WorkflowEdge
        ): boolean => {
          if (edge.source !== node.id) {
            return false;
          }

          const edgeDecision:
            | string
            | null
            | undefined =
            edge.data?.decision ??
            edge.sourceHandle;

          return edgeDecision === decision;
        }
      );

      // ----------------------------------------------
      // NO EDGE = END OF THIS PATH
      // ----------------------------------------------

      if (!selectedEdge) {
        currentNode = undefined;
        continue;
      }

      // ----------------------------------------------
      // FIND TARGET NODE
      // ----------------------------------------------

      const nextNode:
        | WorkflowNode
        | undefined = nodes.find(
        (
          candidate: WorkflowNode
        ): boolean =>
          candidate.id ===
          selectedEdge.target
      );

      if (!nextNode) {
        throw new Error(
          `Target node "${selectedEdge.target}" does not exist.`
        );
      }

      // ----------------------------------------------
      // MOVE FORWARD
      // ----------------------------------------------

      currentNode = nextNode;
    }

    // ------------------------------------------------
    // COMPLETE
    // ------------------------------------------------

    return {
      success: true,

      startNodeId: startNode.id,

      executedNodes: executionLog.length,

      executionOrder: executionLog,
    };
  }
);