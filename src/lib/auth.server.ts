import { getCookie, setCookie } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { podeEstudar, permiteAcao } from "./permissoes";

export type TipoUsuario = "aluno" | "professor" | "administrador";

export type UsuarioSessao = {
  id: number;
  nome: string;
  email: string;
  tipo: TipoUsuario;
};

const NOME_COOKIE = "gramaticando_sessao";
const DURACAO_SEGUNDOS = 60 * 60 * 24 * 7;
const ITERACOES = 100_000;

export class ErroAplicacao extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "ErroAplicacao";
  }
}

function segredo(): string {
  const chave = process.env["SESSION_SECRET"];
  if (!chave) throw new ErroAplicacao("Servidor sem configuração de sessão.");
  return chave;
}

function paraBase64Url(bytes: Uint8Array): string {
  let texto = "";
  for (const b of bytes) texto += String.fromCharCode(b);
  return btoa(texto).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64Url(valor: string): Uint8Array {
  const normalizado = valor.replace(/-/g, "+").replace(/_/g, "/");
  const texto = atob(normalizado + "=".repeat((4 - (normalizado.length % 4)) % 4));
  const bytes = new Uint8Array(texto.length);
  for (let i = 0; i < texto.length; i++) bytes[i] = texto.charCodeAt(i);
  return bytes;
}

/* ------------------------------- senhas ------------------------------- */

async function derivar(senha: string, salt: Uint8Array): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(senha),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: ITERACOES, hash: "SHA-256" },
    material,
    256,
  );
  return new Uint8Array(bits);
}

export async function criarHashSenha(senha: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivar(senha, salt);
  return `pbkdf2$${ITERACOES}$${paraBase64Url(salt)}$${paraBase64Url(hash)}`;
}

export async function conferirSenha(senha: string, armazenada: string): Promise<boolean> {
  const partes = armazenada.split("$");
  if (partes.length !== 4 || partes[0] !== "pbkdf2") return false;
  const saltTexto = partes[2];
  const esperado = partes[3];
  if (!saltTexto || !esperado) return false;
  if (partes[1] !== String(ITERACOES)) return false;
  let hash: string;
  try {
    const salt = deBase64Url(saltTexto);
    if (salt.length !== 16) return false;
    hash = paraBase64Url(await derivar(senha, salt));
  } catch { return false; }
  if (hash.length !== esperado.length) return false;
  let diferenca = 0;
  for (let i = 0; i < hash.length; i++) diferenca |= hash.charCodeAt(i) ^ esperado.charCodeAt(i);
  return diferenca === 0;
}

/* ------------------------------- sessão ------------------------------- */

async function assinar(dados: string): Promise<string> {
  const chave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(segredo()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const assinatura = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(dados));
  return paraBase64Url(new Uint8Array(assinatura));
}

export async function abrirSessao(usuario: { id: number; tipo: TipoUsuario }): Promise<void> {
  const conteudo = paraBase64Url(
    new TextEncoder().encode(
      JSON.stringify({
        id: usuario.id,
        tipo: usuario.tipo,
        exp: Math.floor(Date.now() / 1000) + DURACAO_SEGUNDOS,
      }),
    ),
  );
  const token = `${conteudo}.${await assinar(conteudo)}`;
  setCookie(NOME_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: DURACAO_SEGUNDOS,
  });
}

export function fecharSessao(): void {
  setCookie(NOME_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
}

async function lerSessao(): Promise<{ id: number; tipo: TipoUsuario } | null> {
  const token = getCookie(NOME_COOKIE);
  if (!token) return null;
  const [conteudo, assinatura] = token.split(".");
  if (!conteudo || !assinatura) return null;
  if ((await assinar(conteudo)) !== assinatura) return null;
  try {
    const dados = JSON.parse(new TextDecoder().decode(deBase64Url(conteudo))) as {
      id: number;
      tipo: TipoUsuario;
      exp: number;
    };
    if (!Number.isInteger(dados.id) || dados.id <= 0 || !Number.isFinite(dados.exp) || dados.exp <= Math.floor(Date.now() / 1000)) return null;
    return { id: dados.id, tipo: dados.tipo };
  } catch {
    return null;
  }
}

export async function usuarioAtual(): Promise<UsuarioSessao | null> {
  const sessao = await lerSessao();
  if (!sessao) return null;
  const { data, error } = await supabaseAdmin
    .from("usuario")
    .select("id, nome, email, tipo")
    .eq("id", sessao.id)
    .maybeSingle();
  if (error) throw new ErroAplicacao("Não foi possível consultar o banco de dados.");
  if (!data) return null;
  if (!podeEstudar(data.tipo)) return null;
  return { id: data.id, nome: data.nome, email: data.email, tipo: data.tipo as TipoUsuario };
}

export async function exigirUsuario(tipos?: TipoUsuario[]): Promise<UsuarioSessao> {
  const usuario = await usuarioAtual();
  if (!usuario) throw new ErroAplicacao("Faça login para continuar.");
  if (!permiteAcao(usuario.tipo, tipos)) {
    throw new ErroAplicacao("Você não tem permissão para esta ação.");
  }
  return usuario;
}
