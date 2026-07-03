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
          Planning Poker integrado ao Businessmap. Estime histórias em tempo real e sincronize Story Points diretamente nos cartões do seu quadro.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link to="/setup">
            <PrimaryButton className="px-6 py-2.5">Começar Planning</PrimaryButton>
          </Link>
          <Link to="/room/demo">
            <button
              type="button"
              className="border border-bm-border bg-white hover:bg-bm-board text-bm-textDark px-6 py-2.5 rounded-md text-sm font-medium transition-colors"
            >
              Ver demo da sala
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 text-left">
          {[
            { title: 'Integração nativa', desc: 'Conecta via API v2 do Businessmap — filtros por board, coluna e raia.' },
            { title: 'Tempo real', desc: 'WebSockets sincronizam votos entre facilitador e participantes.' },
            { title: 'Self-hosting', desc: 'Back-end Go leve, ideal para Docker. API Key fica só no browser.' },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-bm-border rounded-md p-4">
              <h3 className="text-sm font-semibold text-bm-textDark">{item.title}</h3>
              <p className="text-xs text-bm-textMuted mt-1.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
