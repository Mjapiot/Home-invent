export default function ExpiryBadge({ date }: { date: string | null }) {
  if (!date) return null;

  const days = Math.ceil(
    (new Date(date).getTime() - Date.now()) / (24 * 3600 * 1000)
  );

  let label: string;
  let cls: string;
  if (days < 0) {
    label = "Périmé";
    cls = "bg-danger text-white";
  } else if (days <= 7) {
    label = days === 0 ? "Aujourd'hui" : `${days} j`;
    cls = "bg-danger-soft text-danger";
  } else if (days <= 30) {
    label = `${days} j`;
    cls = "bg-warning-soft text-warning";
  } else {
    return null;
  }

  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}
