import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { cadastrar, sessaoAtual } from "@/lib/auth.functions";
import { destino } from "./entrar";

export const Route = createFileRoute("/cadastrar")({
  ssr: false,
  loader: async () => {
    const usuario = await sessaoAtual();
    if (usuario) throw redirect({ to: destino(usuario.tipo) });
    return {};
  },
  head: () => ({
    meta: [
      { title: "Criar conta — Gramaticando" },
      {
        name: "description",
        content: "Cadastre-se no Gramaticando como aluno ou professor e comece a estudar.",
      },
      { property: "og:title", content: "Criar conta — Gramaticando" },
      {
        property: "og:description",
        content: "Cadastre-se no Gramaticando como aluno ou professor e comece a estudar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Cadastrar,
});

function Cadastrar() {
  const router = useRouter();
  const criarConta = useServerFn(cadastrar);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);
    const form = new FormData(evento.currentTarget);
    try {
      const usuario = await criarConta({
        data: {
          nome: String(form.get("nome") ?? ""),
          email: String(form.get("email") ?? ""),
          tel: String(form.get("tel") ?? ""),
          senha: String(form.get("senha") ?? ""),
          data_nascimento: String(form.get("data_nascimento") ?? ""),
          tipo: String(form.get("tipo") ?? "aluno"),
        },
      });
      await router.invalidate();
      router.navigate({ to: destino(usuario.tipo) });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível concluir o cadastro.");
      setEnviando(false);
    }
  }

  return (
    <>
      <Cabecalho usuario={null} />
      <main className="mx-auto max-w-6xl px-6">
        <section className="mx-auto max-w-lg py-16">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Cadastro</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">Criar conta</h1>
          <div className="mt-4 h-[3px] w-16 bg-accent" />

          <form onSubmit={enviar} className="mt-8 space-y-4" noValidate>
            <div>
              <label className="rotulo" htmlFor="nome">
                Nome completo
              </label>
              <input id="nome" name="nome" required maxLength={255} className="campo" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
                <label className="rotulo" htmlFor="tel">
                  Telefone (opcional)
                </label>
                <input id="tel" name="tel" type="tel" maxLength={20} className="campo" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="rotulo" htmlFor="data_nascimento">
                  Data de nascimento
                </label>
                <input id="data_nascimento" name="data_nascimento" type="date" className="campo" />
              </div>
              <div>
                <label className="rotulo" htmlFor="tipo">
                  Tipo de conta
                </label>
                <select id="tipo" name="tipo" defaultValue="aluno" className="campo">
                  <option value="aluno">Aluno</option>
                  <option value="professor">Professor</option>
                </select>
              </div>
            </div>
            <div>
              <label className="rotulo" htmlFor="senha">
                Senha (mínimo 8 caracteres)
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
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
              {enviando ? "Cadastrando…" : "Criar conta"}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted">
            Já tem conta?{" "}
            <Link to="/entrar" className="font-medium text-accent underline underline-offset-2">
              Entrar
            </Link>
          </p>
        </section>
      </main>
      <Rodape />
    </>
  );
}
