import { NextResponse } from "next/server";

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
  data?: {
    decision?: Decision;
  };
};

type ExecutionResult = {
  nodeId: string;
  nodeName: string;
  prompt: string;
  decision: Decision;
  branchFollowed: Decision | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nodes = body.nodes as WorkflowNode[];
    const edges = body.edges as WorkflowEdge[];

    // ==============================================
    // BASIC VALIDATION
    // ==============================================

    if (!Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Workflow must contain at least one node.",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(edges)) {
      return NextResponse.json(
        {
          success: false,
          error: "Workflow edges are invalid.",
        },
        { status: 400 }
      );
    }

    // ==============================================
    // VALIDATE NODES
    // ==============================================

    for (const node of nodes) {
      if (!node.id) {
        return NextResponse.json(
          {
            success: false,
            error: "A workflow node is missing its ID.",
          },
          { status: 400 }
        );
      }

      if (!node.data?.label?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: `Node "${node.id}" has no name.`,
          },
          { status: 400 }
        );
      }

      if (!node.data?.prompt?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: `Node "${node.data.label}" has an empty prompt.`,
          },
          { status: 400 }
        );
      }
    }

    // ==============================================
    // VALIDATE EDGE TARGETS
    // ==============================================

    const nodeIds = new Set(nodes.map((node) => node.id));

    for (const edge of edges) {
      if (!nodeIds.has(edge.source)) {
        return NextResponse.json(
          {
            success: false,
            error: `Edge "${edge.id}" contains an invalid source node.`,
          },
          { status: 400 }
        );
      }

      if (!nodeIds.has(edge.target)) {
        return NextResponse.json(
          {
            success: false,
            error: `Edge "${edge.id}" contains an invalid target node.`,
          },
          { status: 400 }
        );
      }
    }

    // ==============================================
    // FIND START NODE
    // ==============================================

    const targetIds = new Set(
      edges.map((edge) => edge.target)
    );

    const startNodes = nodes.filter(
      (node) => !targetIds.has(node.id)
    );

    if (startNodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No start node found. The workflow may contain a cycle.",
        },
        { status: 400 }
      );
    }

    if (startNodes.length > 1) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Multiple start nodes found. Connect the workflow into one execution path.",
        },
        { status: 400 }
      );
    }

    // ==============================================
    // EXECUTE WORKFLOW
    // ==============================================

    const results: ExecutionResult[] = [];

    const visited = new Set<string>();

    let currentNode: WorkflowNode | undefined =
      startNodes[0];

    while (currentNode) {
      const node: WorkflowNode = currentNode;

      // --------------------------------------------
      // CYCLE PROTECTION
      // --------------------------------------------

      if (visited.has(node.id)) {
        return NextResponse.json(
          {
            success: false,
            error: `Cycle detected at node "${node.data.label}".`,
          },
          { status: 400 }
        );
      }

      visited.add(node.id);

      // --------------------------------------------
      // MOCK AI DECISION
      // --------------------------------------------
      //
      // Temporary until OpenAI credits are available.
      //
      // We deliberately choose YES when a YES branch
      // exists. Otherwise choose NO.
      // --------------------------------------------

      const outgoingEdges = edges.filter(
        (edge) => edge.source === node.id
      );

      const yesEdge = outgoingEdges.find(
        (edge) =>
          (edge.data?.decision ??
            edge.sourceHandle) === "YES"
      );

      const noEdge = outgoingEdges.find(
        (edge) =>
          (edge.data?.decision ??
            edge.sourceHandle) === "NO"
      );

      let decision: Decision;

      if (yesEdge) {
        decision = "YES";
      } else if (noEdge) {
        decision = "NO";
      } else {
        // Terminal node.
        // Mock a YES decision but don't follow anything.
        decision = "YES";
      }

      const selectedEdge =
        decision === "YES" ? yesEdge : noEdge;

      results.push({
        nodeId: node.id,
        nodeName: node.data.label,
        prompt: node.data.prompt,
        decision,
        branchFollowed: selectedEdge
          ? decision
          : null,
      });

      // --------------------------------------------
      // TERMINAL NODE
      // --------------------------------------------

      if (!selectedEdge) {
        break;
      }

      // --------------------------------------------
      // NEXT NODE
      // --------------------------------------------

      const nextNode = nodes.find(
        (candidate) =>
          candidate.id === selectedEdge.target
      );

      if (!nextNode) {
        return NextResponse.json(
          {
            success: false,
            error: `Target node "${selectedEdge.target}" does not exist.`,
          },
          { status: 400 }
        );
      }

      currentNode = nextNode;
    }

    // ==============================================
    // SUCCESS
    // ==============================================

    return NextResponse.json({
      success: true,
      mode: "mock",
      startNodeId: startNodes[0].id,
      executedNodes: results.length,
      executionOrder: results,
    });
  } catch (error) {
    console.error(
      "Mock workflow execution failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Workflow execution failed.",
      },
      { status: 500 }
    );
  }
}