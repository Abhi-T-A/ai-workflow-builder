import { NextResponse } from "next/server";

import { inngest } from "@/inngest/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { nodes, edges } = body;

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
          error: "Invalid workflow edges.",
        },
        { status: 400 }
      );
    }

    const result = await inngest.send({
      name: "workflow/execute",
      data: {
        nodes,
        edges,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Workflow execution started.",
      eventIds: result.ids,
    });
  } catch (error) {
    console.error("Failed to start workflow:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to start workflow.",
      },
      { status: 500 }
    );
  }
}