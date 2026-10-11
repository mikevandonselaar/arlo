import { LogOut } from 'lucide-react';
import { getStoredUsername, signOut } from '../lib/auth';

interface ProfilePageProps {
  onSignOut: () => void;
  onNavigateToHeadsUp: () => void;
}

export function ProfilePage({ onSignOut, onNavigateToHeadsUp }: ProfilePageProps) {
  const username = getStoredUsername();

  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  return (
    <div className="h-full flex flex-col bg-bg text-ink">

      {/* Header */}
      <div className="px-6 pt-4 pb-6 flex-shrink-0">
        <h1 className="type-hero">Profiel</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-12 flex flex-col">

        <div className="border-t border-line">
          <div className="flex items-baseline justify-between gap-4 py-4 border-b border-line">
            <span className="type-data text-muted">Gebruikersnaam</span>
            <span className="text-base font-medium truncate">@{username ?? '—'}</span>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-4 border-b border-line">
            <span className="type-data text-muted">Bestellingen</span>
            <span className="type-data text-muted">Binnenkort</span>
          </div>
        </div>

        <div className="mt-auto pt-10 space-y-4">
          <button
            type="button"
            onClick={onNavigateToHeadsUp}
            className="block mx-auto text-sm text-muted underline active:opacity-70"
          >
            Iets vreemds gezien? Laat het weten.
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-sm border border-ink font-medium text-base active:opacity-70"
          >
            <LogOut className="w-4 h-4" />
            Uitloggen
          </button>
        </div>

      </div>
    </div>
  );
}
