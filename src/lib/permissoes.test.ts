import { describe, test } from "node:test";
import { strictEqual } from "node:assert";
import { permiteAcao, podeEstudar } from "./permissoes";

describe("Permissões iguais de alunos e professores", () => {
  for (const tipo of ["aluno", "professor"]) {
    test(`${tipo} pode estudar e responder`, () => {
      strictEqual(podeEstudar(tipo), true);
      strictEqual(permiteAcao(tipo, ["aluno"]), true);
    });
    test(`${tipo} não gerencia conteúdos nem usuários`, () => {
      strictEqual(permiteAcao(tipo, ["professor", "administrador"]), false);
      strictEqual(permiteAcao(tipo, ["administrador"]), false);
    });
  }
  test("administradores não têm acesso ao site", () => {
    strictEqual(podeEstudar("administrador"), false);
    strictEqual(permiteAcao("administrador"), false);
  });
});