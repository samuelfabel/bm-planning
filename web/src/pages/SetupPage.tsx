import { MainLayout } from '@/components/layout/MainLayout';
import { ApiConfigSection } from '@/components/setup/ApiConfigSection';
import { CardQuerySection } from '@/components/setup/CardQuerySection';

export function SetupPage() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-bm-textDark">Configuração da Planning</h1>
          <p className="text-sm text-bm-textMuted mt-1">
            Conecte ao Businessmap, configure o baralho e selecione as tarefas para estimar.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ApiConfigSection />
          <CardQuerySection />
        </div>
      </div>
    </MainLayout>
  );
}
