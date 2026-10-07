import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { sair, type UsuarioSessao } from "@/lib/auth.functions";


export function Cabecalho({ usuario }: { usuario: UsuarioSessao | null }) {
  const router = useRouter();
  const encerrar = useServerFn(sair);

  async function encerrarSessao() {
    await encerrar();
    await router.invalidate();
    router.navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold leading-none tracking-tight text-ink">
            Gramat<span className="text-accent">icando</span>
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted sm:inline">
            pt-br
          </span>
        </Link>

        {usuario ? (
          <nav className="flex items-center gap-2">
            <Link
              to="/aluno"
              className="rounded-md px-3 py-2 font-mono text-xs uppercase tracking-wide text-ink hover:bg-ink/5"
            >
              Minha trilha
            </Link>
            {(
              <Link
                to="/aluno/desempenho"
                className="hidden rounded-md px-3 py-2 font-mono text-xs uppercase tracking-wide text-muted hover:bg-ink/5 sm:inline-flex"
              >
                Desempenho
              </Link>
            )}
            <span className="hidden font-mono text-[11px] uppercase tracking-wide text-muted md:inline">
              {usuario.nome}
            </span>
            <button
              type="button"
              onClick={encerrarSessao}
              className="rounded-md border border-line px-3 py-2 font-mono text-xs uppercase tracking-wide text-ink hover:bg-ink/5"
            >
              Sair
            </button>
          </nav>
        ) : (
          <nav className="flex items-center gap-2">
            <Link
              to="/entrar"
              className="rounded-md px-4 py-2 font-mono text-xs uppercase tracking-wide text-ink hover:bg-ink/5"
            >
              Entrar
            </Link>
            <Link
              to="/cadastrar"
              className="rounded-md bg-accent px-4 py-2 font-mono text-xs uppercase tracking-wide text-paper hover:bg-accent/90"
            >
              Cadastrar
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
