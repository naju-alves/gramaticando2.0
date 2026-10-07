import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { EtiquetaNivel } from "@/components/EtiquetaNivel";
import { sessaoAtual } from "@/lib/auth.functions";
import { obterConteudo } from "@/lib/conteudos.functions";
import {
  listarExerciciosDoAluno,
  responderExercicio,
  type ExercicioAluno,
  type ResultadoResposta,
} from "@/lib/exercicios.functions";

export const Route = createFileRoute("/aluno/conteudo/$id")({
  ssr: false,
  loader: async ({ params }) => {
    const usuario = await sessaoAtual();
    if (!usuario) throw redirect({ to: "/entrar" });
    const id = Number(params.id);
    const [conteudo, exercicios] = await Promise.all([
      obterConteudo({ data: { id } }),
      listarExerciciosDoAluno({ data: { id_conteudo: id } }),
    ]);
    return { usuario, conteudo, exercicios };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.conteudo.titulo} — Gramaticando` : "Conteúdo — Gramaticando" },
      { name: "description", content: loaderData?.conteudo.resumo ?? "Conteúdo de gramática." },
      { property: "og:title", content: loaderData?.conteudo.titulo ?? "Conteúdo — Gramaticando" },
      { property: "og:description", content: loaderData?.conteudo.resumo ?? "Conteúdo de gramática." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <h1 className="font-display text-3xl font-semibold">Não foi possível abrir o conteúdo</h1>
      <p className="mt-3 text-muted">{error instanceof Error ? error.message : "Tente novamente."}</p>
      <Link to="/aluno" className="botao-principal mt-6">Voltar</Link>
    </main>
  ),
  component: PaginaConteudo,
});

function embed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function PaginaConteudo() {
  const { usuario, conteudo, exercicios } = Route.useLoaderData();
  const video = conteudo.video ? embed(conteudo.video) : null;

  return (
    <>
      <Cabecalho usuario={usuario} />
      <main className="mx-auto max-w-6xl px-6">
        <article className="mx-auto max-w-3xl pt-12">
          <Link to="/aluno" className="font-mono text-xs uppercase tracking-wide text-muted hover:text-ink">
            ← Conteúdos
          </Link>
          <div className="mt-6"><EtiquetaNivel idNivel={conteudo.id_nivel} /></div>
          <h1 className="mt-4 text-balance font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            {conteudo.titulo}
          </h1>
          <div className="mt-4 h-[3px] w-20 bg-accent" />
          {conteudo.resumo ? <p className="mt-6 text-pretty text-lg text-muted">{conteudo.resumo}</p> : null}

          {conteudo.video ? (
            <div className="mt-8">
              {video ? (
                <iframe
                  src={video}
                  title={`Vídeo: ${conteudo.titulo}`}
                  className="aspect-video w-full rounded-lg border border-line"
                  allowFullScreen
                />
              ) : (
                <a href={conteudo.video} target="_blank" rel="noreferrer" className="botao-secundario">
                  Assistir ao vídeo
                </a>
              )}
            </div>
          ) : null}

          <div className="mt-10 whitespace-pre-line text-pretty leading-relaxed text-ink">
            {conteudo.explicacao ?? "Explicação ainda não cadastrada."}
          </div>
        </article>

        <section className="mx-auto max-w-3xl border-t-2 border-dashed border-line py-12 mt-12">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">Exercícios</h2>
          {exercicios.length === 0 ? (
            <p className="mt-4 text-muted">Ainda não há exercícios para este conteúdo.</p>
          ) : (
            <ol className="mt-6 space-y-8">
              {exercicios.map((ex, i) => (
                <Exercicio key={ex.id_exercicio} exercicio={ex} numero={i + 1} podeResponder={true} />
              ))}
            </ol>
          )}
        </section>
      </main>
      <Rodape />
    </>
  );
}

function Exercicio({ exercicio, numero, podeResponder }: { exercicio: ExercicioAluno; numero: number; podeResponder: boolean }) {
  const responder = useServerFn(responderExercicio);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<ResultadoResposta | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const dissertativa = exercicio.tipo === "Dissertativa";

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      setResultado(
        await responder({
          data: { id_exercicio: exercicio.id_exercicio, id_alternativa: escolha, resposta: texto },
        }),
      );
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <li className="rounded-lg border border-line p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted">Questão {numero}</span>
        <span className="font-mono text-[11px] uppercase tracking-wide text-muted">{exercicio.tipo}</span>
      </div>
      <p className="mt-3 whitespace-pre-line text-ink">{exercicio.pergunta}</p>

      <form onSubmit={enviar} className="mt-4 space-y-2">
        {dissertativa ? (
          <textarea
            aria-label="Sua resposta"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={5000}
            rows={4}
            className="campo"
          />
        ) : (
          <fieldset className="space-y-2">
            <legend className="sr-only">Alternativas</legend>
            {exercicio.alternativas.map((a, i) => (
              <label
                key={a.id_alternativa}
                className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-ink/5 ${
                  escolha === a.id_alternativa ? "border-accent bg-accent-soft" : "border-line"
                }`}
              >
                <input
                  type="radio"
                  name={`ex-${exercicio.id_exercicio}`}
                  checked={escolha === a.id_alternativa}
                  onChange={() => setEscolha(a.id_alternativa)}
                  className="size-4 accent-accent"
                />
                <span className="text-sm text-ink">
                  {String.fromCharCode(65 + i)}) {a.texto}
                </span>
              </label>
            ))}
          </fieldset>
        )}

        {erro ? <p role="alert" className="rounded-md bg-bad-soft p-3 text-sm text-ink">{erro}</p> : null}

        {podeResponder ? (
          <button type="submit" disabled={enviando} className="botao-principal mt-2 disabled:opacity-60">
            {enviando ? "Enviando…" : "Enviar resposta"}
          </button>
        ) : (
          <p className="text-sm text-muted">Apenas alunos podem enviar respostas.</p>
        )}
      </form>

      {resultado ? (
        <div
          role="status"
          className={`mt-4 rounded-md border p-4 ${
            resultado.acertou === null
              ? "border-line"
              : resultado.acertou
                ? "border-good/30 bg-good-soft"
                : "border-bad/30 bg-bad-soft"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`font-mono text-[11px] font-medium uppercase tracking-wide ${
                resultado.acertou === null ? "text-muted" : resultado.acertou ? "text-good" : "text-bad"
              }`}
            >
              {resultado.acertou === null ? "Enviada" : resultado.acertou ? "Acertou" : "Errou"}
            </span>
            {resultado.nota != null ? (
              <span className={`font-display text-2xl font-semibold ${resultado.acertou ? "text-good" : "text-bad"}`}>
                {resultado.nota}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-ink">{resultado.feedback}</p>
          {resultado.explicacao ? (
            <p className="mt-2 text-sm text-muted"><strong className="text-ink">Explicação:</strong> {resultado.explicacao}</p>
          ) : null}
        </div>
      ) : exercicio.minhaResposta ? (
        <p className="mt-4 font-mono text-[11px] uppercase tracking-wide text-muted">
          Última tentativa: {exercicio.minhaResposta.acertou === null ? "aguardando correção" : exercicio.minhaResposta.acertou ? "acertou" : "errou"}
          {exercicio.minhaResposta.nota != null ? ` · nota ${exercicio.minhaResposta.nota}` : ""}
        </p>
      ) : null}
    </li>
  );
}
