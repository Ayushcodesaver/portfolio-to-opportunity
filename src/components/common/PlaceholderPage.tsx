import { ReactNode } from "react";
import { PageHeader } from "@/components/common/PageHeader";

export function PlaceholderPage({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="container max-w-6xl py-8">
      <PageHeader title={title} description={description} />
      <div className="glass rounded-xl p-10 text-center">
        {children ?? <p className="text-muted-foreground">This section is being built. Full functionality coming next.</p>}
      </div>
    </div>
  );
}
