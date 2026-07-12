export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          status: string
          updated_at: string
          vacancy_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          vacancy_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          vacancy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_profiles: {
        Row: {
          bio: string | null
          birth_date: string | null
          category: string | null
          constancia_url: string | null
          created_at: string
          cv_url: string | null
          education: Json | null
          experience: Json | null
          experience_summary: string
          headline: string | null
          id: string
          phone: string | null
          portfolio_links: Json | null
          show_email: boolean
          show_phone: boolean
          skills: string[] | null
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          bio?: string | null
          birth_date?: string | null
          category?: string | null
          constancia_url?: string | null
          created_at?: string
          cv_url?: string | null
          education?: Json | null
          experience?: Json | null
          experience_summary?: string
          headline?: string | null
          id: string
          phone?: string | null
          portfolio_links?: Json | null
          show_email?: boolean
          show_phone?: boolean
          skills?: string[] | null
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          bio?: string | null
          birth_date?: string | null
          category?: string | null
          constancia_url?: string | null
          created_at?: string
          cv_url?: string | null
          education?: Json | null
          experience?: Json | null
          experience_summary?: string
          headline?: string | null
          id?: string
          phone?: string | null
          portfolio_links?: Json | null
          show_email?: boolean
          show_phone?: boolean
          skills?: string[] | null
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          company_name: string
          company_size: string | null
          contact_channel: string
          created_at: string
          credits_available: number
          description: string | null
          id: string
          industry: string | null
          logo_url: string | null
          phone: string | null
          updated_at: string
          website_or_linkedin: string | null
          whatsapp_number: string
        }
        Insert: {
          company_name: string
          company_size?: string | null
          contact_channel?: string
          created_at?: string
          credits_available?: number
          description?: string | null
          id: string
          industry?: string | null
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          website_or_linkedin?: string | null
          whatsapp_number?: string
        }
        Update: {
          company_name?: string
          company_size?: string | null
          contact_channel?: string
          created_at?: string
          credits_available?: number
          description?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          website_or_linkedin?: string | null
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          initiated_by: string
          recruiter_id: string
          status: string
          vacancy_id: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          initiated_by?: string
          recruiter_id: string
          status?: string
          vacancy_id?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          initiated_by?: string
          recruiter_id?: string
          status?: string
          vacancy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "profiles_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          description: string
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_approved: boolean
          is_featured: boolean
          is_validated: boolean
          location: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          is_approved?: boolean
          is_featured?: boolean
          is_validated?: boolean
          location?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          is_validated?: boolean
          location?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      vacancies: {
        Row: {
          benefits: string[] | null
          category: string | null
          company_id: string
          contract_type: string | null
          created_at: string
          currency: string
          description: string
          employment_type: string | null
          id: string
          is_active: boolean
          location: string
          modality: string
          recruiter_id: string
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          seniority: string | null
          skills: string[] | null
          status: string
          title: string
          updated_at: string
          zone: string | null
        }
        Insert: {
          benefits?: string[] | null
          category?: string | null
          company_id: string
          contract_type?: string | null
          created_at?: string
          currency?: string
          description: string
          employment_type?: string | null
          id?: string
          is_active?: boolean
          location: string
          modality: string
          recruiter_id: string
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: string | null
          skills?: string[] | null
          status?: string
          title: string
          updated_at?: string
          zone?: string | null
        }
        Update: {
          benefits?: string[] | null
          category?: string | null
          company_id?: string
          contract_type?: string | null
          created_at?: string
          currency?: string
          description?: string
          employment_type?: string | null
          id?: string
          is_active?: boolean
          location?: string
          modality?: string
          recruiter_id?: string
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: string | null
          skills?: string[] | null
          status?: string
          title?: string
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacancies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancies_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancies_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "profiles_private"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancies_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "profiles_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_private: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          category: string | null
          company_name: string | null
          company_size: string | null
          constancia_url: string | null
          created_at: string | null
          cv_url: string | null
          description: string | null
          education: Json | null
          email: string | null
          experience: Json | null
          experience_summary: string | null
          full_name: string | null
          headline: string | null
          id: string | null
          industry: string | null
          is_approved: boolean | null
          is_featured: boolean | null
          is_validated: boolean | null
          location: string | null
          logo_url: string | null
          phone: string | null
          portfolio_links: Json | null
          role: string | null
          show_email: boolean | null
          show_phone: boolean | null
          skills: string[] | null
          updated_at: string | null
          website_or_linkedin: string | null
          whatsapp_number: string | null
        }
        Relationships: []
      }
      profiles_view: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          category: string | null
          company_description: string | null
          company_name: string | null
          company_size: string | null
          constancia_url: string | null
          created_at: string | null
          cv_url: string | null
          education: Json | null
          email: string | null
          experience: Json | null
          experience_summary: string | null
          full_name: string | null
          headline: string | null
          id: string | null
          industry: string | null
          is_approved: boolean | null
          is_featured: boolean | null
          is_validated: boolean | null
          location: string | null
          logo_url: string | null
          phone: string | null
          portfolio_links: Json | null
          role: string | null
          show_email: boolean | null
          show_phone: boolean | null
          skills: string[] | null
          updated_at: string | null
          website_or_linkedin: string | null
          whatsapp_number: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_candidate_masked_phone: {
        Args: { p_candidate_id: string; p_viewer_id: string }
        Returns: string
      }
      get_candidate_masked_whatsapp: {
        Args: { p_candidate_id: string; p_viewer_id: string }
        Returns: string
      }
      notify_candidate_contact: {
        Args: {
          p_candidate_id: string
          p_company_name: string
          p_vacancy_title: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

