import { Link2, UserPlus } from 'lucide-react';

interface InvitePanelProps {
  createBusy: boolean;
  acceptBusy: boolean;
  inviteCodeInput: string;
  lastCreatedCode: string | null;
  onInviteCodeInputChange: (value: string) => void;
  onCreateInvite: () => void;
  onAcceptInvite: () => void;
}

export function InvitePanel({
  createBusy,
  acceptBusy,
  inviteCodeInput,
  lastCreatedCode,
  onInviteCodeInputChange,
  onCreateInvite,
  onAcceptInvite,
}: InvitePanelProps) {
  return (
    <section className="rounded-3xl border border-orange-100 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-orange-100 p-2 text-orange-700">
          <UserPlus size={18} />
        </div>
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Friend invites</h2>
          <p className="text-xs text-zinc-600">Create or accept private-beta invite codes.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-amber-400"
          placeholder="Paste invite code"
          value={inviteCodeInput}
          onChange={(event) => onInviteCodeInputChange(event.target.value)}
        />
        <button
          onClick={onAcceptInvite}
          disabled={acceptBusy || !inviteCodeInput.trim()}
          className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Accept invite
        </button>
      </div>

      <button
        onClick={onCreateInvite}
        disabled={createBusy}
        className="mt-3 inline-flex items-center gap-1 rounded-xl bg-orange-50 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-orange-100 disabled:opacity-40"
      >
        <Link2 size={14} />
        Generate invite code
      </button>

      {lastCreatedCode ? (
        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Share code: <span className="font-semibold">{lastCreatedCode}</span>
        </p>
      ) : null}
    </section>
  );
}
