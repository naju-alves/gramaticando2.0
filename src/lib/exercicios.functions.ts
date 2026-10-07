import { createServerFn } from "@tanstack/react-start";

export type TipoExercicio = "Multipla Escolha" | "Dissertativa" | "Verdadeiro/Falso";

export type AlternativaAluno = { id_alternativa: number; texto: string };

export type ExercicioAluno = {
  id_exercicio: number;
  pergunta: string;
  tipo: TipoExercicio;
  alternativas: AlternativaAluno[];
  minhaResposta: {
    resposta: string | null;
    nota: number | null;
    acertou: boolean | null;
    feedback: string | null;
    data_resposta: string;
  } | null;
};

export type ExercicioProfessor = {
  id_exercicio: number;
  pergunta: string;
  tipo: TipoExercicio;
  explicacao: string | null;
  id_conteudo: number;
  alternativas: { id_alternativa: number; texto: string; correta: boolean }[];
};

export type ResultadoResposta = {
  acertou: boolean | null;
  nota: number | null;
  feedback: string;
  explicacao: string | null;
};

export type RespostaAluno = {
  id_resposta: number;
  resposta: string | null;
  nota: number | null;
  acertou: boolean | null;
  feedback: string | null;
  data_resposta: string;
  aluno: string;
  pergunta: string;
  conteudo: string;
};

const TIPOS: TipoExercicio[] = ["Multipla Escolha", "Dissertativa", "Verdadeiro/Falso"];

function numero(valor: unknown, campo: string): number {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`${campo} inválido.`);
  return n;
}

function texto(valor: unknown, campo: string, max: number, obrigatorio = true): string {
  const v = typeof valor === "string" ? valor.trim() : "";
  if (!v) {
    if (obrigatorio) throw new Error(`Informe ${campo}.`);
    return "";
  }
  if (v.length > max) throw new Error(`${campo} deve ter no máximo ${max} caracteres.`);
  return v;
}

export const listarExerciciosDoAluno = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => ({
    id_conteudo: numero(((entrada ?? {}) as Record<string, unknown>)["id_conteudo"], "Conteúdo"),
  }))
  .handler(async ({ data }): Promise<ExercicioAluno[]> => {
    const { exigirUsuario, ErroAplicacao } = await import("./auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const usuario = await exigirUsuario();

    const { data: exercicios, error } = await supabaseAdmin
      .from("exercicios")
      .select("id_exercicio, pergunta, tipo, alternativas(id_alternativa, texto)")
      .eq("id_conteudo", data.id_conteudo)
      .order("id_exercicio");
    if (error) throw new ErroAplicacao("Não foi possível carregar os exercícios.");
    const lista = exercicios ?? [];
    if (lista.length === 0) return [];

    const { data: respostas, error: erroRespostas } = await supabaseAdmin
      .from("respostas")
      .select("resposta, nota, acertou, feedback, data_resposta, id_exercicio")
      .eq("id_usuario", usuario.id)
      .in(
        "id_exercicio",
        lista.map((e) => e.id_exercicio),
      )
      .order("data_resposta", { ascending: false });
    if (erroRespostas) throw new ErroAplicacao("Não foi possível carregar suas respostas.");

    return lista.map((e) => {
      const minha = (respostas ?? []).find((r) => r.id_exercicio === e.id_exercicio);
      return {
        id_exercicio: e.id_exercicio,
        pergunta: e.pergunta,
        tipo: e.tipo as TipoExercicio,
        alternativas: (e.alternativas ?? []).map((a) => ({
          id_alternativa: a.id_alternativa,
          texto: a.texto,
        })),
        minhaResposta: minha
          ? {
              resposta: minha.resposta,
              nota: minha.nota == null ? null : Number(minha.nota),
              acertou: minha.acertou,
              feedback: minha.feedback,
              data_resposta: minha.data_resposta,
            }
          : null,
      };
    });
  });

export const responderExercicio = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => {
    const d = (entrada ?? {}) as Record<string, unknown>;
    return {
      id_exercicio: numero(d["id_exercicio"], "Exercício"),
      id_alternativa: d["id_alternativa"] == null ? null : numero(d["id_alternativa"], "Alternativa"),
      resposta: texto(d["resposta"], "a resposta", 5000, false),
    };
  })
  .handler(async ({ data }): Promise<ResultadoResposta> => {
    const { exigirUsuario, ErroAplicacao } = await import("./auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const usuario = await exigirUsuario(["aluno"]);

    const { data: exercicio, error } = await supabaseAdmin
      .from("exercicios")
      .select("id_exercicio, tipo, explicacao, alternativas(id_alternativa, texto, correta)")
      .eq("id_exercicio", data.id_exercicio)
      .maybeSingle();
    if (error) throw new ErroAplicacao("Não foi possível registrar a resposta.");
    if (!exercicio) throw new ErroAplicacao("Exercício não encontrado.");

    const dissertativa = exercicio.tipo === "Dissertativa";
    let acertou: boolean | null = null;
    let nota: number | null = null;
    let feedback: string;
    let respostaTexto: string;

    if (dissertativa) {
      if (!data.resposta) throw new ErroAplicacao("Escreva sua resposta antes de enviar.");
      respostaTexto = data.resposta;
      feedback = "Resposta enviada. Aguarde a correção do professor.";
    } else {
      if (!data.id_alternativa) throw new ErroAplicacao("Escolha uma alternativa.");
      const escolhida = (exercicio.alternativas ?? []).find(
        (a) => a.id_alternativa === data.id_alternativa,
      );
      if (!escolhida) throw new ErroAplicacao("Alternativa inválida.");
      respostaTexto = escolhida.texto;
      acertou = escolhida.correta;
      nota = escolhida.correta ? 100 : 0;
      feedback = escolhida.correta
        ? "Você acertou! Muito bem."
        : "Resposta incorreta. Releia a explicação do conteúdo e tente novamente.";
    }

    const { error: erroInsert } = await supabaseAdmin.from("respostas").insert({
      resposta: respostaTexto,
      nota,
      acertou,
      feedback,
      id_usuario: usuario.id,
      id_exercicio: exercicio.id_exercicio,
    });
    if (erroInsert) throw new ErroAplicacao("Não foi possível salvar sua resposta.");

    return { acertou, nota, feedback, explicacao: exercicio.explicacao };
  });

export const meuDesempenho = createServerFn({ method: "GET" }).handler(
  async (): Promise<RespostaAluno[]> => {
    const { exigirUsuario, ErroAplicacao } = await import("./auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const usuario = await exigirUsuario(["aluno"]);

    const { data, error } = await supabaseAdmin
      .from("respostas")
      .select(
        "id_resposta, resposta, nota, acertou, feedback, data_resposta, exercicios(pergunta, conteudos(titulo))",
      )
      .eq("id_usuario", usuario.id)
      .order("data_resposta", { ascending: false });
    if (error) throw new ErroAplicacao("Não foi possível carregar seu desempenho.");

    return (data ?? []).map((r) => {
      const exercicio = r.exercicios as
        | { pergunta: string; conteudos: { titulo: string } | null }
        | null;
      return {
        id_resposta: r.id_resposta,
        resposta: r.resposta,
        nota: r.nota == null ? null : Number(r.nota),
        acertou: r.acertou,
        feedback: r.feedback,
        data_resposta: r.data_resposta,
        aluno: usuario.nome,
        pergunta: exercicio?.pergunta ?? "",
        conteudo: exercicio?.conteudos?.titulo ?? "",
      };
    });
  },
);

/* --------------------------- área do professor --------------------------- */

export const listarExerciciosDoConteudo = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => ({
    id_conteudo: numero(((entrada ?? {}) as Record<string, unknown>)["id_conteudo"], "Conteúdo"),
  }))
  .handler(async ({ data }): Promise<ExercicioProfessor[]> => {
    const { exigirUsuario, ErroAplicacao } = await import("./auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await exigirUsuario(["professor", "administrador"]);

    const { data: linhas, error } = await supabaseAdmin
      .from("exercicios")
      .select(
        "id_exercicio, pergunta, tipo, explicacao, id_conteudo, alternativas(id_alternativa, texto, correta)",
      )
      .eq("id_conteudo", data.id_conteudo)
      .order("id_exercicio");
    if (error) throw new ErroAplicacao("Não foi possível carregar os exercícios.");
    return (linhas ?? []).map((e) => ({
      id_exercicio: e.id_exercicio,
      pergunta: e.pergunta,
      tipo: e.tipo as TipoExercicio,
      explicacao: e.explicacao,
      id_conteudo: e.id_conteudo,
      alternativas: (e.alternativas ?? []).map((a) => ({
        id_alternativa: a.id_alternativa,
        texto: a.texto,
        correta: a.correta,
      })),
    }));
  });

export const cadastrarExercicio = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => {
    const d = (entrada ?? {}) as Record<string, unknown>;
    const tipo = typeof d["tipo"] === "string" ? (d["tipo"] as TipoExercicio) : "Multipla Escolha";
    if (!TIPOS.includes(tipo)) throw new Error("Tipo de exercício inválido.");
    const brutas = Array.isArray(d["alternativas"]) ? (d["alternativas"] as unknown[]) : [];
    const alternativas = brutas.map((a) => {
      const item = (a ?? {}) as Record<string, unknown>;
      return {
        texto: texto(item["texto"], "o texto da alternativa", 1000),
        correta: item["correta"] === true,
      };
    });
    if (tipo !== "Dissertativa") {
      if (alternativas.length < 2) throw new Error("Cadastre pelo menos duas alternativas.");
      if (!alternativas.some((a) => a.correta)) throw new Error("Marque a alternativa correta.");
    }
    return {
      id_conteudo: numero(d["id_conteudo"], "Conteúdo"),
      pergunta: texto(d["pergunta"], "a pergunta", 5000),
      tipo,
      explicacao: texto(d["explicacao"], "a explicação", 5000, false),
      alternativas: tipo === "Dissertativa" ? [] : alternativas,
    };
  })
  .handler(async ({ data }) => {
    const { exigirUsuario, ErroAplicacao } = await import("./auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const usuario = await exigirUsuario(["professor", "administrador"]);

    const { data: conteudo, error: erroConteudo } = await supabaseAdmin
      .from("conteudos")
      .select("id, id_usuario")
      .eq("id", data.id_conteudo)
      .maybeSingle();
    if (erroConteudo) throw new ErroAplicacao("Não foi possível acessar o conteúdo.");
    if (!conteudo) throw new ErroAplicacao("Conteúdo não encontrado.");
    if (usuario.tipo === "professor" && conteudo.id_usuario !== usuario.id) {
      throw new ErroAplicacao("Você só pode cadastrar exercícios nos seus conteúdos.");
    }

    const { data: exercicio, error } = await supabaseAdmin
      .from("exercicios")
      .insert({
        pergunta: data.pergunta,
        tipo: data.tipo,
        explicacao: data.explicacao || null,
        id_conteudo: data.id_conteudo,
      })
      .select("id_exercicio")
      .single();
    if (error || !exercicio) throw new ErroAplicacao("Não foi possível cadastrar o exercício.");

    if (data.alternativas.length > 0) {
      const { error: erroAlt } = await supabaseAdmin.from("alternativas").insert(
        data.alternativas.map((a) => ({
          texto: a.texto,
          correta: a.correta,
          id_exercicio: exercicio.id_exercicio,
        })),
      );
      if (erroAlt) throw new ErroAplicacao("Não foi possível cadastrar as alternativas.");
    }

    return { id_exercicio: exercicio.id_exercicio };
  });

export const excluirExercicio = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => ({
    id_exercicio: numero(((entrada ?? {}) as Record<string, unknown>)["id_exercicio"], "Exercício"),
  }))
  .handler(async ({ data }) => {
    const { exigirUsuario, ErroAplicacao } = await import("./auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const usuario = await exigirUsuario(["professor", "administrador"]);
    const { data: exercicio, error: erroBusca } = await supabaseAdmin.from("exercicios")
      .select("id_conteudo").eq("id_exercicio", data.id_exercicio).maybeSingle();
    if (erroBusca || !exercicio) throw new ErroAplicacao("Exercício não encontrado.");
    const { data: conteudo, error: erroDono } = await supabaseAdmin.from("conteudos")
      .select("id_usuario").eq("id", exercicio.id_conteudo).maybeSingle();
    if (erroDono || !conteudo || (usuario.tipo === "professor" && conteudo.id_usuario !== usuario.id)) {
      throw new ErroAplicacao("Você só pode excluir exercícios dos seus conteúdos.");
    }
    const { error } = await supabaseAdmin
      .from("exercicios")
      .delete()
      .eq("id_exercicio", data.id_exercicio);
    if (error) throw new ErroAplicacao("Não foi possível excluir o exercício.");
    return { ok: true };
  });

export const respostasDosAlunos = createServerFn({ method: "POST" })
  .inputValidator((entrada: unknown) => {
    const d = (entrada ?? {}) as Record<string, unknown>;
    return { id_conteudo: d["id_conteudo"] == null ? null : numero(d["id_conteudo"], "Conteúdo") };
  })
  .handler(async ({ data }): Promise<RespostaAluno[]> => {
    const { exigirUsuario, ErroAplicacao } = await import("./auth.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const usuario = await exigirUsuario(["professor", "administrador"]);
    let consultaConteudos = supabaseAdmin.from("conteudos").select("id");
    if (usuario.tipo === "professor") consultaConteudos = consultaConteudos.eq("id_usuario", usuario.id);
    if (data.id_conteudo) consultaConteudos = consultaConteudos.eq("id", data.id_conteudo);
    const { data: conteudos, error: erroConteudos } = await consultaConteudos;
    if (erroConteudos) throw new ErroAplicacao("Não foi possível consultar os conteúdos.");
    const idsConteudos = (conteudos ?? []).map(c => c.id);
    if (!idsConteudos.length) return [];
    const { data: exercicios, error: erroExercicios } = await supabaseAdmin.from("exercicios")
      .select("id_exercicio").in("id_conteudo", idsConteudos);
    if (erroExercicios) throw new ErroAplicacao("Não foi possível consultar os exercícios.");
    const idsExercicios = (exercicios ?? []).map(e => e.id_exercicio);
    if (!idsExercicios.length) return [];
    const { data: linhas, error } = await supabaseAdmin
      .from("respostas")
      .select(
        "id_resposta, resposta, nota, acertou, feedback, data_resposta, usuario(nome), exercicios(pergunta, id_conteudo, conteudos(titulo))",
      )
      .order("data_resposta", { ascending: false })
      .in("id_exercicio", idsExercicios)
      .limit(200);
    if (error) throw new ErroAplicacao("Não foi possível carregar as respostas dos alunos.");

    return (linhas ?? [])
      .map((r) => {
        const exercicio = r.exercicios as
          | { pergunta: string; id_conteudo: number; conteudos: { titulo: string } | null }
          | null;
        return {
          id_resposta: r.id_resposta,
          resposta: r.resposta,
          nota: r.nota == null ? null : Number(r.nota),
          acertou: r.acertou,
          feedback: r.feedback,
          data_resposta: r.data_resposta,
          aluno: (r.usuario as { nome: string } | null)?.nome ?? "Aluno",
          pergunta: exercicio?.pergunta ?? "",
          conteudo: exercicio?.conteudos?.titulo ?? "",
          id_conteudo: exercicio?.id_conteudo ?? 0,
        };
      })
      .filter((r) => (data.id_conteudo ? r.id_conteudo === data.id_conteudo : true));
  });
