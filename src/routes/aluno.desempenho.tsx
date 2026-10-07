import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { sessaoAtual } from "@/lib/auth.functions";
import { meuDesempenho } from "@/lib/exercicios.functions";

export const Route = createFileRoute("/aluno/desempenho")({
  ssr: false,
  loader: async () => {
    const usuario = await sessaoAtual();
    if (!usuario) throw redirect({ to: "/entrar" });
    return { usuario, respostas: await meuDesempenho() };
  },
  head: () => ({
    meta: [
      { title: "Meu desempenho — Gramaticando" },
      { name: "description", content: "Acompanhe suas notas, acertos e feedbacks nos exercícios." },
      { property: "og:title", content: "Meu desempenho — Gramaticando" },
      {
        property: "og:description",
        content: "Acompanhe suas notas, acertos e feedbacks nos exercícios.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Desempenho,
});

function Desempenho() {
  const { usuario, respostas } = Route.useLoaderData();
  const corrigidas = respostas.filter((r) => r.nota != null);
  const acertos = respostas.filter((r) => r.acertou === true).length;
  const media = corrigidas.length
    ? corrigidas.reduce((soma, r) => soma + (r.nota ?? 0), 0) / corrigidas.length
    : null;

  return (
    <>
      <Cabecalho usuario={usuario} />
      <main className="mx-auto max-w-6xl px-6">
        <section className="pt-12 pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Área do aluno</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">
            Meu desempenho
          </h1>
          <div className="mt-4 h-[3px] w-16 bg-accent" />
        </section>

        <div className="grid grid-cols-1 divide-y divide-dashed divide-line border-y-2 border-dashed border-line sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0">
          <div className="py-5 sm:pr-6">
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Respostas enviadas</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">{respostas.length}</p>
          </div>
          <div className="py-5 sm:px-6">
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Acertos</p>
            <p className="mt-2 font-display text-3xl font-semibold text-good">{acertos}</p>
          </div>
          <div className="py-5 sm:pl-6">
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Nota média</p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink">
              {media == null ? "—" : media.toFixed(0)}
            </p>
          </div>
        </div>

        <section className="py-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            Histórico de respostas
          </h2>

          {respostas.length === 0 ? (
            <p className="mt-6 rounded-md border border-dashed border-line p-6 text-sm text-muted">
              Você ainda não respondeu exercícios.{" "}
              <Link to="/aluno" className="font-medium text-accent underline underline-offset-2">
                Escolher um conteúdo
              </Link>
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {respostas.map((r) => (
                <li key={r.id_resposta} className="rounded-lg border border-line p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
                      {r.conteudo}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
                      {new Date(r.data_resposta).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="mt-3 text-ink">{r.pergunta}</p>
                  <p className="mt-2 text-sm text-muted">
                    Sua resposta: <span className="text-ink">{r.resposta}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {r.acertou === null ? (
                      <span className="rounded border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-muted">
                        Aguardando correção
                      </span>
                    ) : (
                      <span
                        className={`rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide ${
                          r.acertou ? "bg-good-soft text-good" : "bg-bad-soft text-bad"
                        }`}
                      >
                        {r.acertou ? "Acertou" : "Errou"}
                      </span>
                    )}
                    <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
                      Nota: {r.nota == null ? "—" : r.nota.toFixed(0)}
                    </span>
                  </div>
                  {r.feedback ? <p className="mt-3 text-sm text-muted">{r.feedback}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Rodape />
    </>
  );
}
