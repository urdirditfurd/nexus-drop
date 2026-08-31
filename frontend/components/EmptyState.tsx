import { AlertCircle } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  fallback?: boolean;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  fallback,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
      <AlertCircle className="mb-4 h-10 w-10 text-zinc-400" />
      <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-zinc-500">{description}</p>
      )}
      {fallback && (
        <p className="mt-3 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          Données de démonstration affichées
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
