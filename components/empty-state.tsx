export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-8 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
    </div>
  );
}
