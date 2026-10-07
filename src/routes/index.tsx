import { createFileRoute, Link } from "@tanstack/react-router";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { sessaoAtual } from "@/lib/auth.functions";
import { listarNiveis } from "@/lib/conteudos.functions";
import caderno from "@/assets/caderno.jpg";

export const Route = createFileRoute("/")({
  loader: async () => ({ usuario: await sessaoAtual(), niveisBanco: await listarNiveis() }),
  head: () => ({
    meta: [
      { title: "Gramaticando — Português e gramática por nível escolar" },
      {
        name: "description",
        content:
          "Plataforma de Língua Portuguesa com conteúdos, videoaulas e exercícios organizados por nível escolar: Fundamental I, Fundamental II e Ensino Médio.",
      },
      { property: "og:title", content: "Gramaticando — Português e gramática por nível escolar" },
      {
        property: "og:description",
        content:
          "Estude gramática com explicações completas e exercícios com correção imediata, do Fundamental I ao Ensino Médio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

const niveis = [
  {
    id: 1,
    etiqueta: "Etiqueta I",
    nome: "Ensino Fundamental I",
    descricao: "Anos 1 a 5 · alfabetização e as primeiras classes de palavras.",
    classe: "bg-p1-soft text-p1",
  },
  {
    id: 2,
    etiqueta: "Etiqueta II",
    nome: "Ensino Fundamental II",
    descricao: "Anos 6 a 9 · frases, concordância e pontuação.",
    classe: "bg-p2-soft text-p2",
  },
  {
    id: 3,
    etiqueta: "Etiqueta III",
    nome: "Ensino Médio",
    descricao: "Análise sintática, figuras e a prova.",
    classe: "bg-p3-soft text-p3",
  },
];

function Inicio() {
  const { usuario, niveisBanco } = Route.useLoaderData();

  return (
    <>
      <Cabecalho usuario={usuario} />

      <main className="mx-auto max-w-6xl px-6">
        <section className="pt-12 pb-10 md:pt-16">
          <div className="max-w-2xl">
            <p className="animate-rise font-mono text-xs uppercase tracking-[0.2em] text-muted">
              Aprender português, sem pressa
            </p>
            <h1 className="mt-5 animate-[rise_0.7s_var(--ease)_0.08s_both] text-balance font-display text-5xl font-semibold tracking-tight text-ink md:text-6xl">
              Gramati<em className="not-italic text-accent">cando</em>
            </h1>
            <div className="mt-4 h-[3px] w-24 origin-left animate-draw bg-accent" />
            <p className="mt-6 max-w-[46ch] animate-[rise_0.7s_var(--ease)_0.18s_both] text-pretty text-lg text-muted">
              Do primeiro substantivo à regência, cada conceito explicado como numa página de caderno — com
              marcações, etiquetas e exercícios que mostram seu progresso.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-[rise_0.7s_var(--ease)_0.28s_both]">
              {usuario ? (
                <Link
                  to="/aluno"
                  className="botao-principal"
                >
                  Continuar estudando
                </Link>
              ) : (
                <>
                  <Link to="/cadastrar" className="botao-principal">
                    Cadastrar-me gratuitamente
                  </Link>
                  <Link to="/entrar" className="botao-secundario">
                    Entrar
                  </Link>
                </>
              )}
            </div>
          </div>
          <img src={caderno} alt="Caderno de estudo de português com lápis e etiquetas coloridas" width={1088} height={608} className="mt-10 max-h-64 w-full object-cover" />
        </section>

        <div className="grid grid-cols-1 divide-y divide-dashed divide-line border-y-2 border-dashed border-line sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0">
          {niveis.map((nivel, indice) => (
            <div
              key={nivel.id}
              className={`py-5 ${indice === 0 ? "sm:pr-6" : indice === 1 ? "sm:px-6" : "sm:pl-6"}`}
            >
              <span
                className={`inline-block rounded px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide ${nivel.classe}`}
              >
                {nivel.etiqueta}
              </span>
              <p className="mt-3 font-display text-lg font-semibold text-ink">{niveisBanco.find(n => n.id_nivel === nivel.id)?.nome ?? "Nível indisponível"}</p>
              <p className="mt-1 text-sm text-muted">{nivel.descricao}</p>
            </div>
          ))}
        </div>

        <section className="grid gap-10 py-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
              Como o Gramaticando funciona
            </h2>
            <ol className="mt-6 space-y-5">
              <li className="border-l-2 border-dashed border-line pl-4">
                <p className="font-display text-lg font-semibold text-ink">1. Escolha seu nível</p>
                <p className="mt-1 max-w-[52ch] text-pretty text-muted">
                  Fundamental I, Fundamental II ou Ensino Médio. Os conteúdos aparecem organizados pela
                  etiqueta do seu nível escolar.
                </p>
              </li>
              <li className="border-l-2 border-dashed border-line pl-4">
                <p className="font-display text-lg font-semibold text-ink">2. Estude o conteúdo</p>
                <p className="mt-1 max-w-[52ch] text-pretty text-muted">
                  Resumo, explicação completa e videoaula quando o professor disponibiliza um link.
                </p>
              </li>
              <li className="border-l-2 border-dashed border-line pl-4">
                <p className="font-display text-lg font-semibold text-ink">3. Resolva os exercícios</p>
                <p className="mt-1 max-w-[52ch] text-pretty text-muted">
                  Múltipla escolha, verdadeiro ou falso e questões dissertativas. Você recebe nota, feedback e
                  a explicação da resposta.
                </p>
              </li>
            </ol>
          </div>

          <div className="lg:col-span-5">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
              Para quem é
            </h2>
            <dl className="mt-6 space-y-4">
              <div className="rounded-md border border-line p-4">
                <dt className="font-mono text-[11px] uppercase tracking-wide text-muted">Aluno</dt>
                <dd className="mt-1 text-sm text-ink">
                  Estuda os conteúdos do seu nível, responde exercícios e acompanha o próprio desempenho.
                </dd>
              </div>
              <div className="rounded-md border border-line p-4">
                <dt className="font-mono text-[11px] uppercase tracking-wide text-muted">Professor</dt>
                <dd className="mt-1 text-sm text-ink">
                  Estuda os mesmos conteúdos, responde exercícios e acompanha o próprio desempenho.
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <Rodape />
    </>
  );
}
