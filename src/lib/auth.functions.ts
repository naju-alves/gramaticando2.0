import { createServerFn } from "@tanstack/react-start";
import { podeEstudar } from "./permissoes";

export type TipoUsuario = "aluno" | "professor" | "administrador";

export type UsuarioSessao = {
  id: number;
  nome: string;
  email: string;
  tipo: TipoUsuario;
};

const TIPOS: TipoUsuario[] = ["aluno", "professor"];

function texto(valor: unknown, campo: string, max: number, obrigatorio = true): string {
  const v = typeof valor === "string" ? valor.trim() : "";
  if (!v) {
    if (obrigatorio) throw new Error(`Informe ${campo}.`);
    return "";
  }
  if (v.length > max) throw new Error(`${campo} deve ter no máximo ${max} caracteres.`);
  return v;
}

function validarEmail(valor: unknown): string {
  const email = texto(valor, "o e-mail", 255).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-mail inválido.");
  return email;
}

export const sessaoAtual = createServerFn({ method: "GET" }).handler(
  async (): Promise<UsuarioSessao | null> => {
    const { usuarioAtual } = await import("./auth.server");
    return usuarioAtual();
  },
);

export const cadastrar = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => {
    const d = (entrada ?? {}) as Record<string, unknown>;
    const senha = typeof d["senha"] === "string" ? d["senha"] : "";
    if (senha.length < 8) throw new Error("A senha deve ter no mínimo 8 caracteres.");
    if (senha.length > 100) throw new Error("A senha deve ter no máximo 100 caracteres.");
    const tipo = typeof d["tipo"] === "string" ? d["tipo"] : "aluno";
    if (!TIPOS.includes(tipo as TipoUsuario)) throw new Error("Tipo de usuário inválido.");
    const nascimento = typeof d["data_nascimento"] === "string" ? d["data_nascimento"] : "";
    return {
      nome: texto(d["nome"], "o nome", 255),
      email: validarEmail(d["email"]),
      tel: texto(d["tel"], "o telefone", 20, false),
      senha,
      data_nascimento: nascimento || null,
      tipo: tipo as TipoUsuario,
    };
  })
  .handler(async ({ data }): Promise<UsuarioSessao> => {
    const { criarHashSenha, abrirSessao, ErroAplicacao } = await import("./auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!podeEstudar(data.tipo)) throw new ErroAplicacao("Tipo de conta indisponível.");

    const { data: existente, error: erroBusca } = await supabaseAdmin
      .from("usuario")
      .select("id")
      .eq("email", data.email)
      .maybeSingle();
    if (erroBusca) throw new ErroAplicacao("Não foi possível acessar o banco de dados.");
    if (existente) throw new ErroAplicacao("Este e-mail já está cadastrado.");

    const { data: criado, error } = await supabaseAdmin
      .from("usuario")
      .insert({
        nome: data.nome,
        email: data.email,
        tel: data.tel || null,
        senha: await criarHashSenha(data.senha),
        data_nascimento: data.data_nascimento,
        tipo: data.tipo,
      })
      .select("id, nome, email, tipo")
      .single();
    if (error || !criado) throw new ErroAplicacao("Não foi possível concluir o cadastro.");

    await abrirSessao({ id: criado.id, tipo: criado.tipo as TipoUsuario });
    return { id: criado.id, nome: criado.nome, email: criado.email, tipo: criado.tipo as TipoUsuario };
  });

export const entrar = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => {
    const d = (entrada ?? {}) as Record<string, unknown>;
    return {
      email: validarEmail(d["email"]),
      senha: typeof d["senha"] === "string" ? d["senha"] : "",
    };
  })
  .handler(async ({ data }): Promise<UsuarioSessao> => {
    const { conferirSenha, abrirSessao, ErroAplicacao } = await import("./auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: usuario, error } = await supabaseAdmin
      .from("usuario")
      .select("id, nome, email, tipo, senha")
      .eq("email", data.email)
      .maybeSingle();
    if (error) throw new ErroAplicacao("Não foi possível acessar o banco de dados.");
    if (!usuario || !podeEstudar(usuario.tipo) || !(await conferirSenha(data.senha, usuario.senha))) {
      throw new ErroAplicacao("E-mail ou senha incorretos.");
    }

    await abrirSessao({ id: usuario.id, tipo: usuario.tipo as TipoUsuario });
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo as TipoUsuario,
    };
  });

export const sair = createServerFn({ method: "POST" }).handler(async () => {
  const { fecharSessao } = await import("./auth.server");
  fecharSessao();
  return { ok: true };
});
