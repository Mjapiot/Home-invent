import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function BackLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-0.5 text-sm font-medium text-muted"
    >
      <ChevronLeft size={16} />
      {label}
    </Link>
  );
}
