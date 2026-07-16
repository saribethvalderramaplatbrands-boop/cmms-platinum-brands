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
      categorias_equipo: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      equipos: {
        Row: {
          categoria_id: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_equipo"]
          fecha_instalacion: string | null
          foto_url: string | null
          id: string
          marca: string | null
          modelo: string | null
          nombre: string
          notas: string | null
          serie: string | null
          sucursal_id: string
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_equipo"]
          fecha_instalacion?: string | null
          foto_url?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nombre: string
          notas?: string | null
          serie?: string | null
          sucursal_id: string
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_equipo"]
          fecha_instalacion?: string | null
          foto_url?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nombre?: string
          notas?: string | null
          serie?: string | null
          sucursal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_equipo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      marcas: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          nombre?: string
        }
        Relationships: []
      }
      orden_fotos: {
        Row: {
          created_at: string
          id: string
          orden_id: string
          subida_por: string | null
          tipo: Database["public"]["Enums"]["tipo_foto"]
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          orden_id: string
          subida_por?: string | null
          tipo?: Database["public"]["Enums"]["tipo_foto"]
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          orden_id?: string
          subida_por?: string | null
          tipo?: Database["public"]["Enums"]["tipo_foto"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "orden_fotos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_trabajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_fotos_subida_por_fkey"
            columns: ["subida_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orden_repuestos: {
        Row: {
          cantidad: number
          costo_unitario: number
          created_at: string
          id: string
          orden_id: string
          repuesto_id: string
        }
        Insert: {
          cantidad: number
          costo_unitario?: number
          created_at?: string
          id?: string
          orden_id: string
          repuesto_id: string
        }
        Update: {
          cantidad?: number
          costo_unitario?: number
          created_at?: string
          id?: string
          orden_id?: string
          repuesto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orden_repuestos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_trabajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orden_repuestos_repuesto_id_fkey"
            columns: ["repuesto_id"]
            isOneToOne: false
            referencedRelation: "repuestos"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_trabajo: {
        Row: {
          costo_mano_obra: number
          costo_repuestos: number
          created_at: string
          descripcion: string | null
          equipo_id: string | null
          estado: Database["public"]["Enums"]["estado_ot"]
          fecha_asignacion: string | null
          fecha_cierre: string | null
          fecha_reporte: string
          id: string
          notas_cierre: string | null
          numero: string
          prioridad: Database["public"]["Enums"]["prioridad_ot"]
          reportado_por: string | null
          sucursal_id: string
          tecnico_id: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          costo_mano_obra?: number
          costo_repuestos?: number
          created_at?: string
          descripcion?: string | null
          equipo_id?: string | null
          estado?: Database["public"]["Enums"]["estado_ot"]
          fecha_asignacion?: string | null
          fecha_cierre?: string | null
          fecha_reporte?: string
          id?: string
          notas_cierre?: string | null
          numero?: string
          prioridad?: Database["public"]["Enums"]["prioridad_ot"]
          reportado_por?: string | null
          sucursal_id: string
          tecnico_id?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          costo_mano_obra?: number
          costo_repuestos?: number
          created_at?: string
          descripcion?: string | null
          equipo_id?: string | null
          estado?: Database["public"]["Enums"]["estado_ot"]
          fecha_asignacion?: string | null
          fecha_cierre?: string | null
          fecha_reporte?: string
          id?: string
          notas_cierre?: string | null
          numero?: string
          prioridad?: Database["public"]["Enums"]["prioridad_ot"]
          reportado_por?: string | null
          sucursal_id?: string
          tecnico_id?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_trabajo_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_reportado_por_fkey"
            columns: ["reportado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          activo: boolean
          created_at: string
          debe_cambiar_password: boolean
          id: string
          marca_id: string | null
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          sucursal_id: string | null
          telefono: string | null
          username: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          debe_cambiar_password?: boolean
          id: string
          marca_id?: string | null
          nombre: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          sucursal_id?: string | null
          telefono?: string | null
          username: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          debe_cambiar_password?: boolean
          id?: string
          marca_id?: string | null
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          sucursal_id?: string | null
          telefono?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfiles_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfiles_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      preventivo_ejecuciones: {
        Row: {
          completado_por: string | null
          created_at: string
          fecha: string
          id: string
          notas: string | null
          preventivo_id: string
        }
        Insert: {
          completado_por?: string | null
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          preventivo_id: string
        }
        Update: {
          completado_por?: string | null
          created_at?: string
          fecha?: string
          id?: string
          notas?: string | null
          preventivo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preventivo_ejecuciones_completado_por_fkey"
            columns: ["completado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preventivo_ejecuciones_preventivo_id_fkey"
            columns: ["preventivo_id"]
            isOneToOne: false
            referencedRelation: "preventivos"
            referencedColumns: ["id"]
          },
        ]
      }
      preventivos: {
        Row: {
          activo: boolean
          checklist: Json
          created_at: string
          descripcion: string | null
          equipo_id: string | null
          frecuencia: Database["public"]["Enums"]["frecuencia_preventivo"]
          id: string
          nombre: string
          proxima_fecha: string
          sucursal_id: string
          tecnico_id: string | null
        }
        Insert: {
          activo?: boolean
          checklist?: Json
          created_at?: string
          descripcion?: string | null
          equipo_id?: string | null
          frecuencia?: Database["public"]["Enums"]["frecuencia_preventivo"]
          id?: string
          nombre: string
          proxima_fecha: string
          sucursal_id: string
          tecnico_id?: string | null
        }
        Update: {
          activo?: boolean
          checklist?: Json
          created_at?: string
          descripcion?: string | null
          equipo_id?: string | null
          frecuencia?: Database["public"]["Enums"]["frecuencia_preventivo"]
          id?: string
          nombre?: string
          proxima_fecha?: string
          sucursal_id?: string
          tecnico_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preventivos_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preventivos_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preventivos_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          activo: boolean
          contacto: string | null
          created_at: string
          email: string | null
          especialidad: string | null
          id: string
          nombre: string
          telefono: string | null
        }
        Insert: {
          activo?: boolean
          contacto?: string | null
          created_at?: string
          email?: string | null
          especialidad?: string | null
          id?: string
          nombre: string
          telefono?: string | null
        }
        Update: {
          activo?: boolean
          contacto?: string | null
          created_at?: string
          email?: string | null
          especialidad?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
        }
        Relationships: []
      }
      repuestos: {
        Row: {
          activo: boolean
          codigo: string | null
          costo_unitario: number
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          proveedor_id: string | null
          stock: number
          stock_minimo: number
        }
        Insert: {
          activo?: boolean
          codigo?: string | null
          costo_unitario?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          proveedor_id?: string | null
          stock?: number
          stock_minimo?: number
        }
        Update: {
          activo?: boolean
          codigo?: string | null
          costo_unitario?: number
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          proveedor_id?: string | null
          stock?: number
          stock_minimo?: number
        }
        Relationships: [
          {
            foreignKeyName: "repuestos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      sucursales: {
        Row: {
          activa: boolean
          codigo: string | null
          created_at: string
          direccion: string | null
          gerente_area: string | null
          gerente_regional: string | null
          id: string
          marca_id: string
          nombre: string
          supervisor: string | null
        }
        Insert: {
          activa?: boolean
          codigo?: string | null
          created_at?: string
          direccion?: string | null
          gerente_area?: string | null
          gerente_regional?: string | null
          id?: string
          marca_id: string
          nombre: string
          supervisor?: string | null
        }
        Update: {
          activa?: boolean
          codigo?: string | null
          created_at?: string
          direccion?: string | null
          gerente_area?: string | null
          gerente_regional?: string | null
          id?: string
          marca_id?: string
          nombre?: string
          supervisor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sucursales_marca_id_fkey"
            columns: ["marca_id"]
            isOneToOne: false
            referencedRelation: "marcas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      mi_rol: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      mi_sucursal: { Args: never; Returns: string }
    }
    Enums: {
      estado_equipo: "activo" | "en_reparacion" | "dado_de_baja"
      estado_ot:
        | "reportada"
        | "asignada"
        | "en_proceso"
        | "espera_repuesto"
        | "completada"
        | "cancelada"
      frecuencia_preventivo:
        | "semanal"
        | "quincenal"
        | "mensual"
        | "bimestral"
        | "trimestral"
        | "semestral"
        | "anual"
      prioridad_ot: "baja" | "media" | "alta" | "critica"
      rol_usuario:
        | "admin"
        | "tecnico"
        | "sucursal"
        | "gerente_area"
        | "gerente_regional"
        | "supervisor"
      tipo_foto: "falla" | "evidencia"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      estado_equipo: ["activo", "en_reparacion", "dado_de_baja"],
      estado_ot: [
        "reportada",
        "asignada",
        "en_proceso",
        "espera_repuesto",
        "completada",
        "cancelada",
      ],
      frecuencia_preventivo: [
        "semanal",
        "quincenal",
        "mensual",
        "bimestral",
        "trimestral",
        "semestral",
        "anual",
      ],
      prioridad_ot: ["baja", "media", "alta", "critica"],
      rol_usuario: [
        "admin",
        "tecnico",
        "sucursal",
        "gerente_area",
        "gerente_regional",
        "supervisor",
      ],
      tipo_foto: ["falla", "evidencia"],
    },
  },
} as const
