import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { entrar, sessaoAtual, type UsuarioSessao } from "@/lib/auth.functions";

export const Route = createFileRoute("/entrar")({
  ssr: false,
  loader: async () => {
    const usuario = await sessaoAtual();
    if (usuario) throw redirect({ to: destino(usuario.tipo) });
    return {};
  },
  head: () => ({
    meta: [
      { title: "Entrar — Gramaticando" },
      { name: "description", content: "Acesse sua conta no Gramaticando com e-mail e senha." },
      { property: "og:title", content: "Entrar — Gramaticando" },
      { property: "og:description", content: "Acesse sua conta no Gramaticando com e-mail e senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Entrar,
});

export function destino(_tipo: UsuarioSessao["tipo"]) {
  return "/aluno" as const;
}

function Entrar() {
  const router = useRouter();
  const autenticar = useServerFn(entrar);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    const form = new FormData(evento.currentTarget);
    try {
      const usuario = await autenticar({
        data: { email: String(form.get("email") ?? ""), senha: String(form.get("senha") ?? "") },
      });
      await router.invalidate();
      router.navigate({ to: destino(usuario.tipo) });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
      setEnviando(false);
    }
  }

  return (
    <>
      <Cabecalho usuario={null} />
      <main className="mx-auto max-w-6xl px-6">
        <section className="mx-auto max-w-md py-16">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Acesso</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">Entrar</h1>
          <div className="mt-4 h-[3px] w-16 bg-accent" />

          <form onSubmit={enviar} className="mt-8 space-y-4" noValidate>
            <div>
              <label className="rotulo" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
                className="campo"
              />
            </div>
            <div>
              <label className="rotulo" htmlFor="senha">
                Senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                autoComplete="current-password"
                required
                maxLength={100}
                className="campo"
              />
            </div>

            {erro ? (
              <p role="alert" className="rounded-md border border-bad/30 bg-bad-soft p-3 text-sm text-ink">
                {erro}
              </p>
            ) : null}

            <button type="submit" disabled={enviando} className="botao-principal w-full disabled:opacity-60">
              {enviando ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted">
            Ainda não tem conta?{" "}
            <Link to="/cadastrar" className="font-medium text-accent underline underline-offset-2">
              Cadastre-se
            </Link>
          </p>
        </section>
      </main>
      <Rodape />
    </>
  );
}
