import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: any; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="text-center py-20 glass rounded-xl">
      <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  );
}
