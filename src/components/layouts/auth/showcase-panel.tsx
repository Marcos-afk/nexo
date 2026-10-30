import { NexoMark } from "@/components/ui/nexo-mark";
import type { LoginStatsView } from "@/models/stats";
import { getContainer } from "@/server/container";
import { formatLoginStats } from "@/utils/format-login-stats";

interface ShowcaseViewProps {
  readonly stats: LoginStatsView;
}

interface StatProps {
  readonly value: string;
  readonly label: string;
  readonly live?: boolean;
  readonly bordered?: boolean;
}

function Stat({ value, label, live = false, bordered = false }: StatProps) {
  const border = bordered ? "border-l border-white/10 pl-6" : "";

  return (
    <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${border}`}>
      <div className="flex items-center gap-2">
        <span className="font-display text-[34px] leading-none tracking-[-0.6px] text-white">
          {value}
        </span>
        {live ? <span className="size-2 rounded-full bg-success" /> : null}
      </div>
      <span className="text-[13.5px] text-white/55">{label}</span>
    </div>
  );
}

function ConversationPreview() {
  return (
    <div className="flex w-125 max-w-full flex-col gap-2.5 rounded-2xl border border-white/8 bg-white/4 p-4.5">
      <div className="flex justify-end">
        <p className="rounded-[12px_12px_4px_12px] bg-paper px-3.5 py-2.25 text-[13.5px] text-ink">
          Meu notebook não conecta na VPN. Erro 809.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-[12.5px]">
          <span className="font-semibold text-white/80">Nexo Assist</span>
          <span className="text-white/45">consultou seus chamados · criou um chamado</span>
        </div>
        <p className="w-95 max-w-full rounded-[4px_12px_12px_12px] bg-white/8 px-3.5 py-2.5 text-[13.5px] leading-normal text-white">
          Pronto: abri o chamado com prioridade alta. Um analista fala com você em até 4 h úteis.
        </p>
        <div className="flex items-center gap-2 rounded-xl bg-paper px-3 py-1.75 text-[12.5px]">
          <span className="size-1.75 rounded-full bg-warning" />
          <span className="font-semibold text-ink">INC-20517</span>
          <span className="text-ink-3">Rede e VPN · Alta · em até 4 h</span>
        </div>
      </div>
    </div>
  );
}

export function ShowcaseView({ stats }: ShowcaseViewProps) {
  return (
    <aside className="hidden w-5/9 max-w-200 shrink-0 flex-col justify-between overflow-hidden bg-ink px-16 pt-10 pb-12 lg:flex">
      <div className="flex items-center gap-2.5 text-white">
        <NexoMark />
        <span className="text-[17px] font-bold tracking-[-0.2px]">Nexo Assist</span>
      </div>
      <div className="flex flex-col gap-9">
        <div className="flex flex-col gap-4.5">
          <span className="text-[13.5px] font-medium text-white/55">
            Service desk de TI da Nexo
          </span>
          <h1 className="font-display text-[54px] leading-[1.04] tracking-[-1.2px] text-white">
            Seu problema de TI, resolvido em uma conversa.
          </h1>
          <p className="max-w-130 text-base leading-[1.55] text-white/65">
            Descreva o que está acontecendo. O assistente consulta seus chamados, busca na central
            de ajuda e chama um analista quando precisa.
          </p>
        </div>
        <div className="pl-24">
          <ConversationPreview />
        </div>
      </div>
      <div className="flex border-t border-white/10 pt-6">
        <Stat value={stats.firstResponse} label="primeira resposta, em média" />
        <Stat value={stats.withoutQueue} label="resolvidos sem fila" bordered />
        <Stat value={stats.analystsOnline} label="analistas online agora" live bordered />
      </div>
    </aside>
  );
}

export async function ShowcasePanel() {
  const { stats } = await getContainer();
  const loginStats = await stats.loginStats().catch(() => null);

  return <ShowcaseView stats={formatLoginStats(loginStats)} />;
}
