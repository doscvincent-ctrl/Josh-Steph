import { P } from "../data/siteData"

export function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-24"
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className="h-12 w-12 rounded-full border-2 animate-spin"
        style={{ borderColor: `${P.pink}30`, borderTopColor: P.pink }}
      />
      <span
        className="mt-4 text-xs uppercase tracking-[0.25em]"
        style={{ color: P.taupe }}
      >
        {label}
      </span>
    </div>
  )
}