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
      company_directory: {
        Row: {
          id: string | null
          company_name: string | null
          logo_url: string | null
          industry: string | null
          company_size: string | null
          description: string | null
          banner_url: string | null
          website_url: string | null
          social_links: Json | null
          verification_status: Database["public"]["Enums"]["verification_status"] | null
        }
        Relationships: []
      }
      candidate_directory: {
        Row: {
          id: string | null
          full_name: string | null
          avatar_url: string | null
          location: string | null
          is_verified: boolean | null
          headline: string | null
          bio: string | null
          skills: string[] | null
          experience: Json | null
          education: Json | null
          preferred_zone: string | null
          specialization_area: string | null
          years_experience: number | null
          trade_description: string | null
          candidate_type: Database["public"]["Enums"]["candidate_type"] | null
        }
        Relationships: []
      }
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
      vacancy_reports: {
        Row: {
          action_taken: string | null
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string | null
          status: string
          updated_at: string
          vacancy_id: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string | null
          status?: string
          updated_at?: string
          vacancy_id?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string | null
          status?: string
          updated_at?: string
          vacancy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacancy_reports_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancy_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          internal_notes: string | null
          priority: string
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          internal_notes?: string | null
          priority?: string
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          internal_notes?: string | null
          priority?: string
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      support_ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_internal_note: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal_note?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_internal_note?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      admin_staff_members: {
        Row: {
          created_at: string
          department: string | null
          id: string
          notes: string | null
          permissions: string[] | null
          profile_id: string
          status: string
          sub_role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          notes?: string | null
          permissions?: string[] | null
          profile_id: string
          status?: string
          sub_role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          notes?: string | null
          permissions?: string[] | null
          profile_id?: string
          status?: string
          sub_role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_staff_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      applications: {
        Row: {
          applied_at: string
          candidate_id: string
          id: string
          status: string
          updated_at: string
          vacancy_id: string
        }
        Insert: {
          applied_at?: string
          candidate_id: string
          id?: string
          status?: string
          updated_at?: string
          vacancy_id: string
        }
        Update: {
          applied_at?: string
          candidate_id?: string
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
            referencedRelation: "candidate_profiles"
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
          candidate_type: Database["public"]["Enums"]["candidate_type"]
          cedula_profesional: string | null
          certifications: Json | null
          created_at: string
          curp: string | null
          education: Json | null
          experience: Json | null
          headline: string | null
          id: string
          job_alerts_enabled: boolean | null
          languages: Json | null
          portfolio_links: Json | null
          preferred_zone: string | null
          rfc: string | null
          skills: string[] | null
          social_links: Json | null
          specialization_area: string | null
          trade_description: string | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          birth_date?: string | null
          candidate_type?: Database["public"]["Enums"]["candidate_type"]
          cedula_profesional?: string | null
          certifications?: Json | null
          created_at?: string
          curp?: string | null
          education?: Json | null
          experience?: Json | null
          headline?: string | null
          id: string
          job_alerts_enabled?: boolean | null
          languages?: Json | null
          portfolio_links?: Json | null
          preferred_zone?: string | null
          rfc?: string | null
          skills?: string[] | null
          social_links?: Json | null
          specialization_area?: string | null
          trade_description?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          birth_date?: string | null
          candidate_type?: Database["public"]["Enums"]["candidate_type"]
          cedula_profesional?: string | null
          certifications?: Json | null
          created_at?: string
          curp?: string | null
          education?: Json | null
          experience?: Json | null
          headline?: string | null
          id?: string
          job_alerts_enabled?: boolean | null
          languages?: Json | null
          portfolio_links?: Json | null
          preferred_zone?: string | null
          rfc?: string | null
          skills?: string[] | null
          social_links?: Json | null
          specialization_area?: string | null
          trade_description?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_private_profiles: {
        Row: {
          id: string
          curp: string | null
          rfc: string | null
          birth_date: string | null
          cedula_profesional: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          curp?: string | null
          rfc?: string | null
          birth_date?: string | null
          cedula_profesional?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          curp?: string | null
          rfc?: string | null
          birth_date?: string | null
          cedula_profesional?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_private_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_employees: {
        Row: {
          company_id: string
          created_at: string
          department: string | null
          employee_code: string | null
          employee_id: string
          hire_date: string | null
          id: string
          job_title: string
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department?: string | null
          employee_code?: string | null
          employee_id: string
          hire_date?: string | null
          id?: string
          job_title: string
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department?: string | null
          employee_code?: string | null
          employee_id?: string
          hire_date?: string | null
          id?: string
          job_title?: string
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invoices: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          currency: string
          id: string
          payment_method: string | null
          plan_name: string
          status: string
        }
        Insert: {
          amount?: number
          company_id: string
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          plan_name: string
          status?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          plan_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          address_details: string | null
          banner_url: string | null
          branch_addresses: Json | null
          company_name: string
          company_size: string | null
          contact_phone: string | null
          corporate_email: string | null
          created_at: string
          credits_available: number
          description: string | null
          entity_type: Database["public"]["Enums"]["company_entity_type"]
          featured_vacancies_allowance: number
          featured_vacancies_used: number
          fiscal_address: string
          id: string
          imss_patronal_registry: string | null
          industry: string
          legal_name: string | null
          legal_rep_name: string | null
          logo_url: string | null
          operation_hours: string | null
          rating: number | null
          repse_registry: string | null
          rfc: string
          social_links: Json | null
          subscription_period_end: string | null
          subscription_plan: string
          subscription_status: string
          updated_at: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website_url: string | null
        }
        Insert: {
          address_details?: string | null
          banner_url?: string | null
          branch_addresses?: Json | null
          company_name: string
          company_size?: string | null
          contact_phone?: string | null
          corporate_email?: string | null
          created_at?: string
          credits_available?: number
          description?: string | null
          entity_type?: Database["public"]["Enums"]["company_entity_type"]
          featured_vacancies_allowance?: number
          featured_vacancies_used?: number
          fiscal_address: string
          id: string
          imss_patronal_registry?: string | null
          industry: string
          legal_name?: string | null
          legal_rep_name?: string | null
          logo_url?: string | null
          operation_hours?: string | null
          rating?: number | null
          repse_registry?: string | null
          rfc: string
          social_links?: Json | null
          subscription_period_end?: string | null
          subscription_plan?: string
          subscription_status?: string
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website_url?: string | null
        }
        Update: {
          address_details?: string | null
          banner_url?: string | null
          branch_addresses?: Json | null
          company_name?: string
          company_size?: string | null
          contact_phone?: string | null
          corporate_email?: string | null
          created_at?: string
          credits_available?: number
          description?: string | null
          entity_type?: Database["public"]["Enums"]["company_entity_type"]
          featured_vacancies_allowance?: number
          featured_vacancies_used?: number
          fiscal_address?: string
          id?: string
          imss_patronal_registry?: string | null
          industry?: string
          legal_name?: string | null
          legal_rep_name?: string | null
          logo_url?: string | null
          operation_hours?: string | null
          rating?: number | null
          repse_registry?: string | null
          rfc?: string
          social_links?: Json | null
          subscription_period_end?: string | null
          subscription_plan?: string
          subscription_status?: string
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_requests: {
        Row: {
          application_id: string
          approved_at: string | null
          candidate_id: string
          company_id: string
          created_at: string
          id: string
          rejected_at: string | null
          requested_documents: string[]
          status: string
        }
        Insert: {
          application_id: string
          approved_at?: string | null
          candidate_id: string
          company_id: string
          created_at?: string
          id?: string
          rejected_at?: string | null
          requested_documents?: string[]
          status?: string
        }
        Update: {
          application_id?: string
          approved_at?: string | null
          candidate_id?: string
          company_id?: string
          created_at?: string
          id?: string
          rejected_at?: string | null
          requested_documents?: string[]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_access_requests_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_requests_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          description: string
          id: string
          is_read: boolean
          target_vacancy_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_read?: boolean
          target_vacancy_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_read?: boolean
          target_vacancy_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_target_vacancy_id_fkey"
            columns: ["target_vacancy_id"]
            isOneToOne: false
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_documents: {
        Row: {
          created_at: string
          doc_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size_bytes: number | null
          file_url: string
          id: string
          owner_id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size_bytes?: number | null
          file_url: string
          id?: string
          owner_id: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          owner_id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_verified: boolean
          location: string | null
          role: Database["public"]["Enums"]["user_role"]
          terms_accepted_at: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_verified?: boolean
          location?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          terms_accepted_at?: string
          updated_at?: string
          whatsapp_number: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_verified?: boolean
          location?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          terms_accepted_at?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      saved_vacancies: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          vacancy_id: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          vacancy_id: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          vacancy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_vacancies_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_vacancies_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
        ]
      }
      vacancies: {
        Row: {
          benefits: string[] | null
          category: string
          company_id: string
          created_at: string
          currency: string | null
          description: string
          employment_type: string
          featured_until: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_promoted: boolean
          location: string
          modality: string
          recruiter_id: string
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          skills: string[] | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          zone: string
        }
        Insert: {
          benefits?: string[] | null
          category: string
          company_id: string
          created_at?: string
          currency?: string | null
          description: string
          employment_type: string
          featured_until?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_promoted?: boolean
          location?: string
          modality?: string
          recruiter_id: string
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          zone: string
        }
        Update: {
          benefits?: string[] | null
          category?: string
          company_id?: string
          created_at?: string
          currency?: string | null
          description?: string
          employment_type?: string
          featured_until?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_promoted?: boolean
          location?: string
          modality?: string
          recruiter_id?: string
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          skills?: string[] | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          zone?: string
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
        ]
      }
    }
    Views: {
      company_directory: {
        Row: {
          id: string | null
          company_name: string | null
          logo_url: string | null
          industry: string | null
          company_size: string | null
          description: string | null
          banner_url: string | null
          website_url: string | null
          social_links: Json | null
          verification_status: Database["public"]["Enums"]["verification_status"] | null
        }
        Relationships: []
      }
      candidate_directory: {
        Row: {
          id: string | null
          full_name: string | null
          avatar_url: string | null
          location: string | null
          is_verified: boolean | null
          headline: string | null
          bio: string | null
          skills: string[] | null
          experience: Json | null
          education: Json | null
          preferred_zone: string | null
          specialization_area: string | null
          years_experience: number | null
          trade_description: string | null
          candidate_type: Database["public"]["Enums"]["candidate_type"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      candidate_type: "trabajador" | "oficio" | "profesionista"
      company_entity_type: "persona_fisica" | "persona_moral"
      document_type:
        | "ine_passport"
        | "curp"
        | "constancia_situacion_fiscal"
        | "proof_of_address"
        | "cv"
        | "cedula_profesional"
        | "titulo_profesional"
        | "acta_constitutiva"
        | "legal_power"
        | "legal_rep_id"
        | "imss_registry"
        | "repse"
        | "operating_license"
        | "work_certificate"
        | "recommendation_letter"
        | "course_certificate"
        | "work_photo"
      employee_status: "onboarding" | "active" | "suspended" | "terminated"
      user_role: "candidate" | "company" | "admin"
      verification_status: "pending" | "approved" | "rejected"
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
    Enums: {
      candidate_type: ["trabajador", "oficio", "profesionista"],
      company_entity_type: ["persona_fisica", "persona_moral"],
      document_type: [
        "ine_passport",
        "curp",
        "constancia_situacion_fiscal",
        "proof_of_address",
        "cv",
        "cedula_profesional",
        "titulo_profesional",
        "acta_constitutiva",
        "legal_power",
        "legal_rep_id",
        "imss_registry",
        "repse",
        "operating_license",
        "work_certificate",
        "recommendation_letter",
        "course_certificate",
        "work_photo",
      ],
      employee_status: ["onboarding", "active", "suspended", "terminated"],
      user_role: ["candidate", "company", "admin"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
