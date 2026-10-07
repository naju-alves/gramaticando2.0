export function podeEstudar(tipo: string): boolean {
  return tipo === "aluno" || tipo === "professor";
}

export function permiteAcao(tipo: string, tipos?: readonly string[]): boolean {
  return podeEstudar(tipo) && (!tipos || tipos.includes("aluno"));
}