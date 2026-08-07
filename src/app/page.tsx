import { WorkflowEditor } from "@/components/workflow/workflow-editor";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">

      <header className="flex h-20 items-center justify-between border-b px-6">
        <div>
          <h1 className="text-xl font-bold">
            AI Workflow Builder
          </h1>

          <p className="text-sm text-muted-foreground">
            Build and execute AI-powered decision workflows
          </p>
        </div>
      </header>

      <WorkflowEditor />

    </main>
  );
}