# AI Workflow Builder

A visual AI-powered workflow builder for creating and executing branching decision workflows.

Users can create decision nodes, connect them using **YES/NO branches**, configure AI prompts, execute workflows, and inspect execution logs through an interactive visual interface.

> **Current MVP:** The application includes the full OpenAI + Inngest execution architecture. A mock execution endpoint is currently used for local demonstrations when OpenAI API credits are unavailable.

---

## Features

- Visual drag-and-drop workflow editor
- Custom AI decision nodes
- YES / NO branching
- Add, edit, move, and delete nodes
- Interactive node property editor
- Workflow validation
- Start-node detection
- Graph traversal
- Cycle detection
- Execution logs
- Running / Success / Failed states
- Error handling
- Local workflow persistence
- Inngest background workflow integration
- OpenAI decision-engine integration
- Mock execution mode for development
- Responsive workflow canvas with MiniMap and controls

---

## Demo

The workflow editor allows users to visually construct decision trees.

Example:

```text
                    ┌───────────────────┐
                    │   Support Check   │
                    │                   │
                    │ Is this a support │
                    │     request?      │
                    └─────────┬─────────┘
                              │
                    ┌─────────┴─────────┐
                   YES                  NO
                    │                    │
                    ▼                    ▼
          ┌─────────────────┐    ┌─────────────────┐
          │ Technical Issue │    │      Sales      │
          └─────────────────┘    └─────────────────┘
```

During execution, each decision determines which branch is followed.

---

## Screenshot

Add your application screenshot here:

```markdown
![AI Workflow Builder](./docs/workflow-builder.png)
```

Create a `docs` folder in the project root and place your screenshot there as:

```text
docs/workflow-builder.png
```

---

## How It Works

A workflow consists of **decision nodes** connected through YES and NO edges.

Each decision node contains an AI prompt.

Example:

```text
Is this a customer support request?
```

The decision engine evaluates the prompt and produces:

```text
YES
```

or:

```text
NO
```

The workflow engine then follows the matching branch and continues execution until the path reaches a terminal node.

---

## Architecture

```text
┌──────────────────────────────┐
│          Next.js UI          │
│                              │
│  React Flow Workflow Editor  │
└──────────────┬───────────────┘
               │
               │ POST
               ▼
┌──────────────────────────────┐
│       Next.js API Layer      │
│                              │
│   /api/workflow/run          │
│   /api/workflow/mock-run     │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│           Inngest            │
│                              │
│ Background Workflow Engine   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      Decision Engine         │
│                              │
│       OpenAI API             │
│         YES / NO             │
└──────────────┬───────────────┘
               │
               ▼
        Follow matching edge
               │
               ▼
          Next decision
```

---

## Workflow Execution

The execution engine performs the following steps:

1. Validate workflow nodes and edges.
2. Find the workflow's starting node.
3. Validate the node prompt.
4. Execute the decision.
5. Receive a `YES` or `NO` result.
6. Find the corresponding outgoing edge.
7. Move to the next node.
8. Repeat until no matching edge remains.
9. Mark the workflow as completed.

The engine also tracks visited nodes to detect cycles.

---

## Execution Logs

Workflow execution is displayed in the UI.

Example:

```text
Workflow execution started.

Support Check
AI decision: YES

Following YES path.

Technical Issue
AI decision: YES

End of workflow path reached.

Workflow completed successfully.
2 node(s) executed.
```

Execution states include:

```text
Idle
Running
Success
Failed
```

---

## Error Handling

The application handles common invalid workflow states, including:

- Empty workflows
- Empty node names
- Empty AI prompts
- Multiple start nodes
- Missing start nodes
- Cyclic workflows
- Invalid edge sources
- Invalid edge targets
- Missing target nodes
- Invalid AI responses
- API execution failures
- Duplicate execution attempts

---

## Mock Execution Mode

The project contains a mock execution endpoint:

```text
/api/workflow/mock-run
```

This allows the workflow editor and execution UI to be demonstrated without consuming OpenAI API credits.

The production-oriented execution path remains available through:

```text
/api/workflow/run
        ↓
Inngest
        ↓
OpenAI
```

The mock mode is intended for development and demonstration purposes.

---

## Tech Stack

### Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Flow (`@xyflow/react`)

### Backend

- Next.js Route Handlers
- Inngest

### AI

- OpenAI API

### Storage

- Browser Local Storage for MVP workflow persistence

---

## Project Structure

```text
ai-workflow-builder/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── inngest/
│   │   │   │   └── route.ts
│   │   │   │
│   │   │   └── workflow/
│   │   │       ├── mock-run/
│   │   │       │   └── route.ts
│   │   │       │
│   │   │       └── run/
│   │   │           └── route.ts
│   │   │
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   └── workflow/
│   │       ├── decision-node.tsx
│   │       ├── execution-panel.tsx
│   │       └── workflow-editor.tsx
│   │
│   ├── inngest/
│   │   ├── client.ts
│   │   └── functions.ts
│   │
│   ├── lib/
│   │   └── utils.ts
│   │
│   └── types/
│       ├── execution.ts
│       └── workflow.ts
│
├── .env.example
├── components.json
├── package.json
└── README.md
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Abhi-T-A/ai-workflow-builder.git
```

```bash
cd ai-workflow-builder
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create:

```text
.env.local
```

Add:

```env
OPENAI_API_KEY=your_openai_api_key
```

Never commit `.env.local` or your real API key.

### 4. Start Next.js

```bash
npm run dev
```

Open the local URL displayed by Next.js in your terminal.

---

## Running Inngest Locally

The real AI workflow execution architecture uses Inngest.

Keep Next.js running in one terminal:

```bash
npm run dev
```

Open another terminal and run:

```bash
npx inngest-cli@latest dev
```

The Inngest development server will discover:

```text
/api/inngest
```

---

## Production Build

Check TypeScript:

```bash
npx tsc --noEmit
```

Create a production build:

```bash
npm run build
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key used by the AI decision engine |

---

## Future Improvements

- Real-time execution updates from Inngest
- Highlight the currently executing node
- Highlight the selected YES/NO path
- Database-backed workflow persistence
- Multiple saved workflows
- Authentication
- Workflow templates
- Additional workflow node types
- Webhook nodes
- HTTP/API nodes
- Delay nodes
- Workflow execution history
- Undo/redo
- Workflow import/export
- Production deployment

---

## Repository

GitHub: `Abhi-T-A/ai-workflow-builder`

---

## Author

**Abhi T A**

Built as a full-stack AI workflow orchestration project using Next.js, React Flow, Inngest, and OpenAI.
