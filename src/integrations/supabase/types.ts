export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alternativas: {
        Row: {
          correta: boolean
          id_alternativa: number
          id_exercicio: number
          texto: string
        }
        Insert: {
          correta?: boolean
          id_alternativa?: number
          id_exercicio: number
          texto: string
        }
        Update: {
          correta?: boolean
          id_alternativa?: number
          id_exercicio?: number
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "alternativas_id_exercicio_fkey"
            columns: ["id_exercicio"]
            isOneToOne: false
            referencedRelation: "exercicios"
            referencedColumns: ["id_exercicio"]
          },
        ]
      }
      conteudos: {
        Row: {
          data_publicacao: string
          explicacao: string | null
          id: number
          id_nivel: number
          id_usuario: number | null
          resumo: string | null
          titulo: string
          video: string | null
        }
        Insert: {
          data_publicacao?: string
          explicacao?: string | null
          id?: number
          id_nivel: number
          id_usuario?: number | null
          resumo?: string | null
          titulo: string
          video?: string | null
        }
        Update: {
          data_publicacao?: string
          explicacao?: string | null
          id?: number
          id_nivel?: number
          id_usuario?: number | null
          resumo?: string | null
          titulo?: string
          video?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conteudos_id_nivel_fkey"
            columns: ["id_nivel"]
            isOneToOne: false
            referencedRelation: "niveis"
            referencedColumns: ["id_nivel"]
          },
          {
            foreignKeyName: "conteudos_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      exercicios: {
        Row: {
          explicacao: string | null
          id_conteudo: number
          id_exercicio: number
          pergunta: string
          tipo: Database["public"]["Enums"]["exercicio_tipo"]
        }
        Insert: {
          explicacao?: string | null
          id_conteudo: number
          id_exercicio?: number
          pergunta: string
          tipo?: Database["public"]["Enums"]["exercicio_tipo"]
        }
        Update: {
          explicacao?: string | null
          id_conteudo?: number
          id_exercicio?: number
          pergunta?: string
          tipo?: Database["public"]["Enums"]["exercicio_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "exercicios_id_conteudo_fkey"
            columns: ["id_conteudo"]
            isOneToOne: false
            referencedRelation: "conteudos"
            referencedColumns: ["id"]
          },
        ]
      }
      niveis: {
        Row: {
          id_nivel: number
          nome: string
        }
        Insert: {
          id_nivel?: number
          nome: string
        }
        Update: {
          id_nivel?: number
          nome?: string
        }
        Relationships: []
      }
      respostas: {
        Row: {
          acertou: boolean | null
          data_resposta: string
          feedback: string | null
          id_exercicio: number
          id_resposta: number
          id_usuario: number
          nota: number | null
          resposta: string | null
        }
        Insert: {
          acertou?: boolean | null
          data_resposta?: string
          feedback?: string | null
          id_exercicio: number
          id_resposta?: number
          id_usuario: number
          nota?: number | null
          resposta?: string | null
        }
        Update: {
          acertou?: boolean | null
          data_resposta?: string
          feedback?: string | null
          id_exercicio?: number
          id_resposta?: number
          id_usuario?: number
          nota?: number | null
          resposta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "respostas_id_exercicio_fkey"
            columns: ["id_exercicio"]
            isOneToOne: false
            referencedRelation: "exercicios"
            referencedColumns: ["id_exercicio"]
          },
          {
            foreignKeyName: "respostas_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario: {
        Row: {
          data_nascimento: string | null
          email: string
          id: number
          nome: string
          senha: string
          tel: string | null
          tipo: Database["public"]["Enums"]["usuario_tipo"]
        }
        Insert: {
          data_nascimento?: string | null
          email: string
          id?: number
          nome: string
          senha: string
          tel?: string | null
          tipo?: Database["public"]["Enums"]["usuario_tipo"]
        }
        Update: {
          data_nascimento?: string | null
          email?: string
          id?: number
          nome?: string
          senha?: string
          tel?: string | null
          tipo?: Database["public"]["Enums"]["usuario_tipo"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      exercicio_tipo: "Multipla Escolha" | "Dissertativa" | "Verdadeiro/Falso"
      usuario_tipo: "aluno" | "professor" | "administrador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      exercicio_tipo: ["Multipla Escolha", "Dissertativa", "Verdadeiro/Falso"],
      usuario_tipo: ["aluno", "professor", "administrador"],
    },
  },
} as const
