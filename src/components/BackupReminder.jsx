import { AlertTriangle } from "lucide-react";

// =================== BACKUP REMINDER BANNER ===================
// Appears at the top of the page when no backup has been made for >24 hours.
// Provides a "Backup Now" button that jumps the user to the Data Entry tab.
export function BackupReminder({ lastBackupAt, setTab }) {
  if (!lastBackupAt) {
    // Never backed up — show urgent banner
    return (
      <div className="bg-red-50 border-l-4 border-red-700 px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-red-900">No backup yet</div>
            <div className="text-xs text-red-800/90">Your data lives only in this browser. Click "Backup Now" to save a copy to disk.</div>
          </div>
        </div>
        <button
          onClick={() => setTab("data")}
          className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 text-sm font-semibold whitespace-nowrap"
        >
          Backup Now →
        </button>
      </div>
    );
  }

  // How long since last backup?
  const lastDate = new Date(lastBackupAt);
  const now = new Date();
  const ms = now - lastDate;
  const hours = ms / (1000 * 60 * 60);
  const days = Math.floor(hours / 24);

  let timeAgo;
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(ms / (1000 * 60)));
    timeAgo = `${mins} minute${mins === 1 ? "" : "s"} ago`;
  } else if (hours < 24) {
    const h = Math.floor(hours);
    timeAgo = `${h} hour${h === 1 ? "" : "s"} ago`;
  } else {
    timeAgo = `${days} day${days === 1 ? "" : "s"} ago`;
  }

  // Threshold: 24h = warning, 48h = urgent, <24h = nothing
  if (hours < 24) return null; // recent enough, no banner

  const urgent = hours >= 48;
  const colorClasses = urgent
    ? "bg-red-50 border-red-700 text-red-900"
    : "bg-orange-50 border-orange-600 text-orange-900";
  const buttonClasses = urgent
    ? "bg-red-700 hover:bg-red-800 text-white"
    : "bg-orange-600 hover:bg-orange-700 text-white";

  return (
    <div className={`border-l-4 px-4 py-3 mb-4 flex items-center justify-between gap-3 flex-wrap ${colorClasses}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold">
            Last backup: {timeAgo}{urgent && " — please back up now"}
          </div>
          <div className="text-xs opacity-90">
            Your latest changes only live in this browser. Click "Backup Now" to save a fresh copy.
          </div>
        </div>
      </div>
      <button
        onClick={() => setTab("data")}
        className={`px-4 py-2 text-sm font-semibold whitespace-nowrap ${buttonClasses}`}
      >
        Backup Now →
      </button>
    </div>
  );
}

