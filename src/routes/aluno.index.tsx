import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { EtiquetaNivel } from "@/components/EtiquetaNivel";
import { sessaoAtual } from "@/lib/auth.functions";
import { listarConteudos, listarNiveis } from "@/lib/conteudos.functions";

export const Route = createFileRoute("/aluno/")({
  ssr: false,
  loader: async () => {
    const usuario = await sessaoAtual();
    if (!usuario) throw redirect({ to: "/entrar" });
    const [niveis, conteudos] = await Promise.all([
      listarNiveis(),
      listarConteudos({ data: { id_nivel: null } }),
    ]);
    return { usuario, niveis, conteudos };
  },
  head: () => ({
    meta: [
      { title: "Minha trilha — Gramaticando" },
      {
        name: "description",
        content: "Escolha seu nível escolar e estude os conteúdos de gramática disponíveis.",
      },
      { property: "og:title", content: "Minha trilha — Gramaticando" },
      {
        property: "og:description",
        content: "Escolha seu nível escolar e estude os conteúdos de gramática disponíveis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AreaAluno,
});

function AreaAluno() {
  const { usuario, niveis, conteudos } = Route.useLoaderData();
  const [nivelSelecionado, setNivelSelecionado] = useState<number | null>(null);

  const lista = nivelSelecionado
    ? conteudos.filter((c) => c.id_nivel === nivelSelecionado)
    : conteudos;

  return (
    <>
      <Cabecalho usuario={usuario} />
      <main className="mx-auto max-w-6xl px-6">
        <section className="pt-12 pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Área do aluno</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">
            Olá, {usuario.nome.split(" ")[0]}
          </h1>
          <div className="mt-4 h-[3px] w-16 bg-accent" />
          <p className="mt-4 max-w-[52ch] text-pretty text-muted">
            Escolha seu nível escolar para ver os conteúdos, estudar a explicação e resolver os exercícios.
          </p>
        </section>

        <div className="flex flex-wrap gap-2 border-y-2 border-dashed border-line py-5">
          <button
            type="button"
            onClick={() => setNivelSelecionado(null)}
            aria-pressed={nivelSelecionado === null}
            className={`rounded-md px-4 py-2 font-mono text-xs uppercase tracking-wide ${
              nivelSelecionado === null ? "bg-accent text-paper" : "border border-line text-ink hover:bg-ink/5"
            }`}
          >
            Todos os níveis
          </button>
          {niveis.map((nivel) => (
            <button
              key={nivel.id_nivel}
              type="button"
              onClick={() => setNivelSelecionado(nivel.id_nivel)}
              aria-pressed={nivelSelecionado === nivel.id_nivel}
              className={`rounded-md px-4 py-2 font-mono text-xs uppercase tracking-wide ${
                nivelSelecionado === nivel.id_nivel
                  ? "bg-accent text-paper"
                  : "border border-line text-ink hover:bg-ink/5"
              }`}
            >
              {nivel.nome}
            </button>
          ))}
        </div>

        <section className="py-10">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            Conteúdos
          </h2>

          {lista.length === 0 ? (
            <p className="mt-6 rounded-md border border-dashed border-line p-6 text-sm text-muted">
              Nenhum conteúdo cadastrado para este nível ainda. Assim que um professor publicar uma aula, ela
              aparece aqui.
            </p>
          ) : (
            <ul className="mt-6 grid gap-5 md:grid-cols-2">
              {lista.map((conteudo) => (
                <li key={conteudo.id} className="rounded-lg border border-line p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <EtiquetaNivel
                      idNivel={conteudo.id_nivel}
                      nome={niveis.find((n) => n.id_nivel === conteudo.id_nivel)?.nome}
                    />
                    {conteudo.video ? (
                      <span className="rounded border border-line px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-muted">
                        Vídeo
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-ink">
                    {conteudo.titulo}
                  </h3>
                  <p className="mt-2 max-w-[52ch] text-pretty text-sm text-muted">
                    {conteudo.resumo ?? "Sem resumo."}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="font-mono text-[11px] uppercase tracking-wide text-muted">
                      {conteudo.autor ? `por ${conteudo.autor}` : "Gramaticando"}
                    </span>
                    <Link
                      to="/aluno/conteudo/$id"
                      params={{ id: String(conteudo.id) }}
                      className="rounded-md bg-accent px-4 py-2 font-mono text-xs uppercase tracking-wide text-paper hover:bg-accent/90"
                    >
                      Estudar
                    </Link>
                  </div>
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
