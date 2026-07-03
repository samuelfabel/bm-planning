import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PrimaryButton } from '@/components/ui/FormPrimitives';

export function HomePage() {
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex h-16 w-16 rounded-xl bg-bm-navy items-center justify-center mb-6">
          <span className="text-2xl font-bold text-bm-blue">BM</span>
        </div>
        <h1 className="text-3xl font-bold text-bm-textDark tracking-tight">
          BM Planning
        </h1>
        <p className="text-lg text-bm-textMuted mt-3 max-w-xl mx-auto leading-relaxed">
          Planning Poker integrated with Businessmap. Estimate stories in real time and sync Story Points directly to cards on your board.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link to="/setup">
            <PrimaryButton className="px-6 py-2.5">Start Planning</PrimaryButton>
          </Link>
        </div>

        <div className="mt-8 p-5 bg-bm-surface border border-bm-border rounded-md text-left max-w-lg mx-auto">
          <h2 className="text-sm font-semibold text-bm-textDark">Try the demo</h2>
          <p className="text-xs text-bm-textMuted mt-1.5 leading-relaxed">
            No setup required — mock tasks and participants. Pick a role to preview the experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Link to="/room/demo?as=croupier" className="flex-1">
              <button
                type="button"
                className="w-full border border-bm-border bg-bm-board hover:bg-bm-surfaceHover text-bm-textDark px-4 py-2.5 rounded-md text-sm font-medium transition-colors text-left"
              >
                <span className="block font-semibold">As Croupier</span>
                <span className="block text-xs text-bm-textMuted mt-0.5">Run the session, reveal votes</span>
              </button>
            </Link>
            <Link to="/room/demo?as=participant" className="flex-1">
              <button
                type="button"
                className="w-full border border-bm-border bg-bm-board hover:bg-bm-surfaceHover text-bm-textDark px-4 py-2.5 rounded-md text-sm font-medium transition-colors text-left"
              >
                <span className="block font-semibold">As Participant</span>
                <span className="block text-xs text-bm-textMuted mt-0.5">Pick a card from the deck</span>
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 text-left">
          {[
            { title: 'Native integration', desc: 'Connects via Businessmap API v2 — filter by board, column, and lane.' },
            { title: 'Real time', desc: 'WebSockets sync votes between facilitator and participants.' },
            { title: 'Self-hosting', desc: 'Lightweight Go back-end, ideal for Docker. API Key stays in the browser only.' },
          ].map((item) => (
            <div key={item.title} className="bg-bm-surface border border-bm-border rounded-md p-4">
              <h3 className="text-sm font-semibold text-bm-textDark">{item.title}</h3>
              <p className="text-xs text-bm-textMuted mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
