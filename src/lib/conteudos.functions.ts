import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export type Nivel = { id_nivel: number; nome: string };

export type ConteudoResumo = {
  id: number;
  titulo: string;
  resumo: string | null;
  video: string | null;
  data_publicacao: string;
  id_nivel: number;
  autor: string | null;
};

export type ConteudoCompleto = ConteudoResumo & { explicacao: string | null };

function texto(valor: unknown, campo: string, max: number, obrigatorio = true): string {
  const v = typeof valor === "string" ? valor.trim() : "";
  if (!v) {
    if (obrigatorio) throw new Error(`Informe ${campo}.`);
    return "";
  }
  if (v.length > max) throw new Error(`${campo} deve ter no máximo ${max} caracteres.`);
  return v;
}

function numero(valor: unknown, campo: string): number {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${campo} inválido.`);
  return n;
}

function validarConteudo(entrada: unknown) {
  const d = (entrada ?? {}) as Record<string, unknown>;
  const video = texto(d["video"], "o vídeo", 255, false);
  if (video && !/^https?:\/\//i.test(video)) throw new Error("O vídeo deve ser um link começando com http.");
  return {
    titulo: texto(d["titulo"], "o título", 255),
    resumo: texto(d["resumo"], "o resumo", 2000, false),
    explicacao: texto(d["explicacao"], "a explicação", 100000, false),
    video,
    id_nivel: numero(d["id_nivel"], "Nível escolar"),
  };
}

export const listarNiveis = createServerFn({ method: "GET" }).handler(async (): Promise<Nivel[]> => {
  const { ErroAplicacao } = await import("./auth.server");
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'] ?? process.env['SUPABASE_ANON_KEY'];
  if (!url || !key) throw new ErroAplicacao("Não foi possível conectar ao banco.");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await client
    .from("niveis")
    .select("id_nivel, nome")
    .order("id_nivel");
  if (error) throw new ErroAplicacao("Não foi possível carregar os níveis escolares.");
  return data ?? [];
});

export const listarConteudos = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => {
    const d = (entrada ?? {}) as Record<string, unknown>;
    return {
      id_nivel: d["id_nivel"] == null ? null : numero(d["id_nivel"], "Nível escolar"),
      apenasMeus: d["apenasMeus"] === true,
    };
  })
  .handler(async ({ data }): Promise<ConteudoResumo[]> => {
    const { exigirUsuario, ErroAplicacao } = await import("./auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const usuario = await exigirUsuario();

    let consulta = supabaseAdmin
      .from("conteudos")
      .select("id, titulo, resumo, video, data_publicacao, id_nivel, usuario:id_usuario(nome)")
      .order("data_publicacao", { ascending: false })
      .order("id", { ascending: false });
    if (data.id_nivel) consulta = consulta.eq("id_nivel", data.id_nivel);
    if (data.apenasMeus && usuario.tipo === "professor") consulta = consulta.eq("id_usuario", usuario.id);

    const { data: linhas, error } = await consulta;
    if (error) throw new ErroAplicacao("Não foi possível carregar os conteúdos.");
    return (linhas ?? []).map((l) => ({
      id: l.id,
      titulo: l.titulo,
      resumo: l.resumo,
      video: l.video,
      data_publicacao: l.data_publicacao,
      id_nivel: l.id_nivel,
      autor: (l.usuario as { nome: string } | null)?.nome ?? null,
    }));
  });

export const obterConteudo = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => ({
    id: numero(((entrada ?? {}) as Record<string, unknown>)["id"], "Conteúdo"),
  }))
  .handler(async ({ data }): Promise<ConteudoCompleto> => {
    const { exigirUsuario, ErroAplicacao } = await import("./auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await exigirUsuario();

    const { data: linha, error } = await supabaseAdmin
      .from("conteudos")
      .select("id, titulo, resumo, explicacao, video, data_publicacao, id_nivel, usuario:id_usuario(nome)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new ErroAplicacao("Não foi possível carregar o conteúdo.");
    if (!linha) throw new ErroAplicacao("Conteúdo não encontrado.");
    return {
      id: linha.id,
      titulo: linha.titulo,
      resumo: linha.resumo,
      explicacao: linha.explicacao,
      video: linha.video,
      data_publicacao: linha.data_publicacao,
      id_nivel: linha.id_nivel,
      autor: (linha.usuario as { nome: string } | null)?.nome ?? null,
    };
  });

export const salvarConteudo = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => {
    const d = (entrada ?? {}) as Record<string, unknown>;
    return {
      id: d["id"] == null ? null : numero(d["id"], "Conteúdo"),
      ...validarConteudo(d),
    };
  })
  .handler(async ({ data }) => {
    const { exigirUsuario, ErroAplicacao } = await import("./auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const usuario = await exigirUsuario(["professor", "administrador"]);

    const campos = {
      titulo: data.titulo,
      resumo: data.resumo || null,
      explicacao: data.explicacao || null,
      video: data.video || null,
      id_nivel: data.id_nivel,
    };

    if (data.id) {
      let consulta = supabaseAdmin.from("conteudos").update(campos).eq("id", data.id);
      if (usuario.tipo === "professor") consulta = consulta.eq("id_usuario", usuario.id);
      const { data: atualizado, error } = await consulta.select("id").maybeSingle();
      if (error) throw new ErroAplicacao("Não foi possível salvar o conteúdo.");
      if (!atualizado) throw new ErroAplicacao("Conteúdo não encontrado ou sem permissão.");
      return { id: atualizado.id };
    }

    const { data: criado, error } = await supabaseAdmin
      .from("conteudos")
      .insert({ ...campos, id_usuario: usuario.id })
      .select("id")
      .single();
    if (error || !criado) throw new ErroAplicacao("Não foi possível cadastrar o conteúdo.");
    return { id: criado.id };
  });

export const excluirConteudo = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => ({
    id: numero(((entrada ?? {}) as Record<string, unknown>)["id"], "Conteúdo"),
  }))
  .handler(async ({ data }) => {
    const { exigirUsuario, ErroAplicacao } = await import("./auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const usuario = await exigirUsuario(["professor", "administrador"]);

    let consulta = supabaseAdmin.from("conteudos").delete().eq("id", data.id);
    if (usuario.tipo === "professor") consulta = consulta.eq("id_usuario", usuario.id);
    const { error } = await consulta;
    if (error) throw new ErroAplicacao("Não foi possível excluir o conteúdo.");
    return { ok: true };
  });
