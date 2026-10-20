export function SearchForm({ label, placeholder, defaultValue }: { label: string; placeholder: string; defaultValue?: string }) {
  return (
    <form action="/search" role="search" className="flex max-w-xl gap-2">
      <input className="input flex-1" type="search" name="q" aria-label={label} placeholder={placeholder} defaultValue={defaultValue} maxLength={60} />
      <button className="btn btn-primary" type="submit">{label}</button>
    </form>
  );
}
