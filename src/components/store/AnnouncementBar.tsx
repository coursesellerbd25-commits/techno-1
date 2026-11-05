export function AnnouncementBar({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="bg-brand-deep text-aqua">
      <div className="mx-auto max-w-7xl px-4 py-1.5 text-center text-xs sm:text-sm">
        {message}
      </div>
    </div>
  );
}
