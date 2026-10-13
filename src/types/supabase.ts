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
        ComputedFields: never
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
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_staff_members_profile_id_fkey"
            columns: ["profile_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_at: string
          candidate_id: string
          hired_at: string | null
          id: string
          interview_details: Json | null
          interview_status: string | null
          notes: string | null
          rating: number | null
          scheduled_interview_at: string | null
          status: string
          updated_at: string
          vacancy_id: string
        }
        ComputedFields: never
        Insert: {
          applied_at?: string
          candidate_id: string
          hired_at?: string | null
          id?: string
          interview_details?: Json | null
          interview_status?: string | null
          notes?: string | null
          rating?: number | null
          scheduled_interview_at?: string | null
          status?: string
          updated_at?: string
          vacancy_id: string
        }
        Update: {
          applied_at?: string
          candidate_id?: string
          hired_at?: string | null
          id?: string
          interview_details?: Json | null
          interview_status?: string | null
          notes?: string | null
          rating?: number | null
          scheduled_interview_at?: string | null
          status?: string
          updated_at?: string
          vacancy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_vacancy_id_fkey"
            columns: ["vacancy_id"]
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_certifications: {
        Row: {
          candidate_id: string
          created_at: string
          credential_url: string | null
          id: string
          issue_date: string | null
          issuer: string
          name: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          candidate_id: string
          created_at?: string
          credential_url?: string | null
          id?: string
          issue_date?: string | null
          issuer: string
          name: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          credential_url?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_certifications_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_educations: {
        Row: {
          candidate_id: string
          created_at: string
          degree: string
          end_date: string | null
          field_of_study: string | null
          id: string
          institution: string
          is_current: boolean
          start_date: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          candidate_id: string
          created_at?: string
          degree: string
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          institution: string
          is_current?: boolean
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          degree?: string
          end_date?: string | null
          field_of_study?: string | null
          id?: string
          institution?: string
          is_current?: boolean
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_educations_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_experiences: {
        Row: {
          achievements: string | null
          candidate_id: string
          company_name: string
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_current: boolean
          position: string
          start_date: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          achievements?: string | null
          candidate_id: string
          company_name: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          position: string
          start_date: string
          updated_at?: string
        }
        Update: {
          achievements?: string | null
          candidate_id?: string
          company_name?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          position?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_experiences_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_languages: {
        Row: {
          candidate_id: string
          created_at: string
          id: string
          language: string
          level: string
        }
        ComputedFields: never
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          language: string
          level?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          language?: string
          level?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_languages_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_private_profiles: {
        Row: {
          birth_date: string | null
          cedula_profesional: string | null
          created_at: string
          curp: string | null
          id: string
          rfc: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          birth_date?: string | null
          cedula_profesional?: string | null
          created_at?: string
          curp?: string | null
          id: string
          rfc?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          cedula_profesional?: string | null
          created_at?: string
          curp?: string | null
          id?: string
          rfc?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_private_profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_private_profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_profiles: {
        Row: {
          bio: string | null
          candidate_type: Database["public"]["Enums"]["candidate_type"]
          certifications: Json | null
          created_at: string
          education: Json | null
          experience: Json | null
          headline: string | null
          id: string
          job_alerts_enabled: boolean | null
          languages: Json | null
          portfolio_links: Json | null
          preferred_zone: string | null
          skills: string[] | null
          social_links: Json | null
          specialization_area: string | null
          trade_description: string | null
          updated_at: string
          years_experience: number | null
        }
        ComputedFields: never
        Insert: {
          bio?: string | null
          candidate_type?: Database["public"]["Enums"]["candidate_type"]
          certifications?: Json | null
          created_at?: string
          education?: Json | null
          experience?: Json | null
          headline?: string | null
          id: string
          job_alerts_enabled?: boolean | null
          languages?: Json | null
          portfolio_links?: Json | null
          preferred_zone?: string | null
          skills?: string[] | null
          social_links?: Json | null
          specialization_area?: string | null
          trade_description?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          candidate_type?: Database["public"]["Enums"]["candidate_type"]
          certifications?: Json | null
          created_at?: string
          education?: Json | null
          experience?: Json | null
          headline?: string | null
          id?: string
          job_alerts_enabled?: boolean | null
          languages?: Json | null
          portfolio_links?: Json | null
          preferred_zone?: string | null
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
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_attendance: {
        Row: {
          break_end_time: string | null
          break_start_time: string | null
          check_in_accuracy: number | null
          check_in_distance_meters: number | null
          check_in_lat: number | null
          check_in_lng: number | null
          check_in_method: string
          check_in_time: string | null
          check_out_time: string | null
          company_id: string
          created_at: string
          delay_minutes: number
          employee_id: string
          id: string
          justification_comments: string | null
          justification_evidence_url: string | null
          justification_label: string | null
          justification_reason_type: string | null
          justification_reviewed_at: string | null
          justification_reviewed_by: string | null
          justification_status: string | null
          justification_submitted_at: string | null
          notes: string | null
          overtime_hours: number
          overtime_notes: string | null
          overtime_rate_type: string | null
          overtime_status: string | null
          scheduled_check_in: string
          scheduled_check_out: string
          status: string
          updated_at: string
          work_date: string
        }
        ComputedFields: never
        Insert: {
          break_end_time?: string | null
          break_start_time?: string | null
          check_in_accuracy?: number | null
          check_in_distance_meters?: number | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_method?: string
          check_in_time?: string | null
          check_out_time?: string | null
          company_id: string
          created_at?: string
          delay_minutes?: number
          employee_id: string
          id?: string
          justification_comments?: string | null
          justification_evidence_url?: string | null
          justification_label?: string | null
          justification_reason_type?: string | null
          justification_reviewed_at?: string | null
          justification_reviewed_by?: string | null
          justification_status?: string | null
          justification_submitted_at?: string | null
          notes?: string | null
          overtime_hours?: number
          overtime_notes?: string | null
          overtime_rate_type?: string | null
          overtime_status?: string | null
          scheduled_check_in?: string
          scheduled_check_out?: string
          status?: string
          updated_at?: string
          work_date: string
        }
        Update: {
          break_end_time?: string | null
          break_start_time?: string | null
          check_in_accuracy?: number | null
          check_in_distance_meters?: number | null
          check_in_lat?: number | null
          check_in_lng?: number | null
          check_in_method?: string
          check_in_time?: string | null
          check_out_time?: string | null
          company_id?: string
          created_at?: string
          delay_minutes?: number
          employee_id?: string
          id?: string
          justification_comments?: string | null
          justification_evidence_url?: string | null
          justification_label?: string | null
          justification_reason_type?: string | null
          justification_reviewed_at?: string | null
          justification_reviewed_by?: string | null
          justification_status?: string | null
          justification_submitted_at?: string | null
          notes?: string | null
          overtime_hours?: number
          overtime_notes?: string | null
          overtime_rate_type?: string | null
          overtime_status?: string | null
          scheduled_check_in?: string
          scheduled_check_out?: string
          status?: string
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_attendance_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_attendance_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_attendance_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "company_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      company_branches: {
        Row: {
          address: string
          company_id: string
          created_at: string
          id: string
          is_headquarters: boolean
          lat: number | null
          lng: number | null
          name: string
          phone: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          address: string
          company_id: string
          created_at?: string
          id?: string
          is_headquarters?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          company_id?: string
          created_at?: string
          id?: string
          is_headquarters?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_branches_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_branches_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_contracts: {
        Row: {
          application_id: string | null
          candidate_id: string | null
          company_id: string
          company_signature_url: string | null
          company_signed: boolean
          contract_type: string
          created_at: string
          department: string
          employee_id: string | null
          employee_signature_url: string | null
          employee_signed: boolean
          end_date: string | null
          folio: string
          id: string
          job_title: string
          notes: string | null
          payment_frequency: string
          salary: number
          start_date: string
          status: string
          template_type: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          application_id?: string | null
          candidate_id?: string | null
          company_id: string
          company_signature_url?: string | null
          company_signed?: boolean
          contract_type: string
          created_at?: string
          department: string
          employee_id?: string | null
          employee_signature_url?: string | null
          employee_signed?: boolean
          end_date?: string | null
          folio: string
          id?: string
          job_title: string
          notes?: string | null
          payment_frequency?: string
          salary: number
          start_date: string
          status?: string
          template_type?: string
          updated_at?: string
        }
        Update: {
          application_id?: string | null
          candidate_id?: string | null
          company_id?: string
          company_signature_url?: string | null
          company_signed?: boolean
          contract_type?: string
          created_at?: string
          department?: string
          employee_id?: string | null
          employee_signature_url?: string | null
          employee_signed?: boolean
          end_date?: string | null
          folio?: string
          id?: string
          job_title?: string
          notes?: string | null
          payment_frequency?: string
          salary?: number
          start_date?: string
          status?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_contracts_application_id_fkey"
            columns: ["application_id"]
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_contracts_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_contracts_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_contracts_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_contracts_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "company_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      company_employees: {
        Row: {
          avatar_url: string | null
          bank_name: string | null
          base_salary_monthly: number | null
          clabe_account: string | null
          company_id: string
          created_at: string
          curp: string | null
          department: string | null
          email: string | null
          emergency_contact: Json | null
          employee_code: string | null
          employee_id: string | null
          full_name: string
          hire_date: string | null
          id: string
          job_title: string
          notes: string | null
          nss: string | null
          payment_frequency: string | null
          phone: string | null
          rfc: string | null
          status: Database["public"]["Enums"]["employee_status"]
          termination_date: string | null
          termination_reason: string | null
          updated_at: string
          work_schedule: string | null
        }
        ComputedFields: never
        Insert: {
          avatar_url?: string | null
          bank_name?: string | null
          base_salary_monthly?: number | null
          clabe_account?: string | null
          company_id: string
          created_at?: string
          curp?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employee_code?: string | null
          employee_id?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          job_title: string
          notes?: string | null
          nss?: string | null
          payment_frequency?: string | null
          phone?: string | null
          rfc?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          termination_date?: string | null
          termination_reason?: string | null
          updated_at?: string
          work_schedule?: string | null
        }
        Update: {
          avatar_url?: string | null
          bank_name?: string | null
          base_salary_monthly?: number | null
          clabe_account?: string | null
          company_id?: string
          created_at?: string
          curp?: string | null
          department?: string | null
          email?: string | null
          emergency_contact?: Json | null
          employee_code?: string | null
          employee_id?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          job_title?: string
          notes?: string | null
          nss?: string | null
          payment_frequency?: string | null
          phone?: string | null
          rfc?: string | null
          status?: Database["public"]["Enums"]["employee_status"]
          termination_date?: string | null
          termination_reason?: string | null
          updated_at?: string
          work_schedule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_employees_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_employees_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_employees_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_evaluations: {
        Row: {
          attendance_score: number
          avatar_url: string | null
          average_score: number
          comments: string | null
          company_id: string
          created_at: string
          customer_service_score: number
          department: string | null
          development_plan: string | null
          employee_id: string | null
          employee_name: string
          evaluation_date: string
          evaluator_id: string | null
          evaluator_name: string
          evaluator_role: string | null
          goals_achieved: string | null
          goals_score: number
          growth_areas: Json | null
          id: string
          job_title: string | null
          period: string
          productivity_score: number
          punctuality_score: number
          status: string
          strengths: Json | null
          teamwork_score: number
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          attendance_score?: number
          avatar_url?: string | null
          average_score?: number
          comments?: string | null
          company_id: string
          created_at?: string
          customer_service_score?: number
          department?: string | null
          development_plan?: string | null
          employee_id?: string | null
          employee_name: string
          evaluation_date?: string
          evaluator_id?: string | null
          evaluator_name: string
          evaluator_role?: string | null
          goals_achieved?: string | null
          goals_score?: number
          growth_areas?: Json | null
          id?: string
          job_title?: string | null
          period: string
          productivity_score?: number
          punctuality_score?: number
          status?: string
          strengths?: Json | null
          teamwork_score?: number
          updated_at?: string
        }
        Update: {
          attendance_score?: number
          avatar_url?: string | null
          average_score?: number
          comments?: string | null
          company_id?: string
          created_at?: string
          customer_service_score?: number
          department?: string | null
          development_plan?: string | null
          employee_id?: string | null
          employee_name?: string
          evaluation_date?: string
          evaluator_id?: string | null
          evaluator_name?: string
          evaluator_role?: string | null
          goals_achieved?: string | null
          goals_score?: number
          growth_areas?: Json | null
          id?: string
          job_title?: string | null
          period?: string
          productivity_score?: number
          punctuality_score?: number
          status?: string
          strengths?: Json | null
          teamwork_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_evaluations_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_evaluations_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_evaluations_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "company_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      company_incidents: {
        Row: {
          category: string
          category_label: string | null
          company_id: string
          created_at: string
          department: string | null
          description: string
          employee_id: string | null
          employee_name: string
          evidence_file_name: string | null
          evidence_type: string | null
          evidence_url: string | null
          id: string
          incident_date: string
          job_title: string | null
          resolution_notes: string | null
          responsible_supervisor: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          category: string
          category_label?: string | null
          company_id: string
          created_at?: string
          department?: string | null
          description: string
          employee_id?: string | null
          employee_name: string
          evidence_file_name?: string | null
          evidence_type?: string | null
          evidence_url?: string | null
          id?: string
          incident_date?: string
          job_title?: string | null
          resolution_notes?: string | null
          responsible_supervisor?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          category_label?: string | null
          company_id?: string
          created_at?: string
          department?: string | null
          description?: string
          employee_id?: string | null
          employee_name?: string
          evidence_file_name?: string | null
          evidence_type?: string | null
          evidence_url?: string | null
          id?: string
          incident_date?: string
          job_title?: string | null
          resolution_notes?: string | null
          responsible_supervisor?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_incidents_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_incidents_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_incidents_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "company_employees"
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
        ComputedFields: never
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
            referencedRelation: "company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invoices_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_leaves: {
        Row: {
          candidate_id: string | null
          company_id: string
          created_at: string
          employee_id: string | null
          end_date: string
          id: string
          reason: string | null
          rejection_reason: string | null
          request_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: string
          total_working_days: number
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          candidate_id?: string | null
          company_id: string
          created_at?: string
          employee_id?: string | null
          end_date: string
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          request_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: string
          total_working_days: number
          updated_at?: string
        }
        Update: {
          candidate_id?: string | null
          company_id?: string
          created_at?: string
          employee_id?: string | null
          end_date?: string
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          request_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: string
          total_working_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_leaves_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_leaves_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_leaves_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "company_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      company_nom035_surveys: {
        Row: {
          action_plan: string | null
          activity_factors_score: number
          company_id: string
          created_at: string
          department: string | null
          employee_id: string | null
          employee_name: string
          environment_score: number
          guide_type: string
          id: string
          job_title: string | null
          leadership_relations_score: number
          organizational_climate_score: number
          risk_level: string
          status: string
          survey_date: string
          time_organization_score: number
          total_score: number
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          action_plan?: string | null
          activity_factors_score?: number
          company_id: string
          created_at?: string
          department?: string | null
          employee_id?: string | null
          employee_name: string
          environment_score?: number
          guide_type?: string
          id?: string
          job_title?: string | null
          leadership_relations_score?: number
          organizational_climate_score?: number
          risk_level?: string
          status?: string
          survey_date?: string
          time_organization_score?: number
          total_score?: number
          updated_at?: string
        }
        Update: {
          action_plan?: string | null
          activity_factors_score?: number
          company_id?: string
          created_at?: string
          department?: string | null
          employee_id?: string | null
          employee_name?: string
          environment_score?: number
          guide_type?: string
          id?: string
          job_title?: string | null
          leadership_relations_score?: number
          organizational_climate_score?: number
          risk_level?: string
          status?: string
          survey_date?: string
          time_organization_score?: number
          total_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_nom035_surveys_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_nom035_surveys_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_nom035_surveys_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "company_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      company_payroll_items: {
        Row: {
          absence_deductions: number
          attendance_bonus: number
          bank_name: string | null
          base_salary_period: number
          clabe: string | null
          company_id: string
          created_at: string
          days_worked: number
          delay_deductions: number
          department: string | null
          employee_id: string
          employee_name: string
          id: string
          imss_deduction: number
          isr_estimated: number
          job_title: string | null
          late_arrivals: number
          net_pay: number
          notes: string | null
          overtime_hours: number
          overtime_pay: number
          payroll_id: string
          performance_bonus: number
          punctuality_bonus: number
          total_deductions: number
          total_perceptions: number
          unjustified_absences: number
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          absence_deductions?: number
          attendance_bonus?: number
          bank_name?: string | null
          base_salary_period?: number
          clabe?: string | null
          company_id: string
          created_at?: string
          days_worked?: number
          delay_deductions?: number
          department?: string | null
          employee_id: string
          employee_name: string
          id?: string
          imss_deduction?: number
          isr_estimated?: number
          job_title?: string | null
          late_arrivals?: number
          net_pay?: number
          notes?: string | null
          overtime_hours?: number
          overtime_pay?: number
          payroll_id: string
          performance_bonus?: number
          punctuality_bonus?: number
          total_deductions?: number
          total_perceptions?: number
          unjustified_absences?: number
          updated_at?: string
        }
        Update: {
          absence_deductions?: number
          attendance_bonus?: number
          bank_name?: string | null
          base_salary_period?: number
          clabe?: string | null
          company_id?: string
          created_at?: string
          days_worked?: number
          delay_deductions?: number
          department?: string | null
          employee_id?: string
          employee_name?: string
          id?: string
          imss_deduction?: number
          isr_estimated?: number
          job_title?: string | null
          late_arrivals?: number
          net_pay?: number
          notes?: string | null
          overtime_hours?: number
          overtime_pay?: number
          payroll_id?: string
          performance_bonus?: number
          punctuality_bonus?: number
          total_deductions?: number
          total_perceptions?: number
          unjustified_absences?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_payroll_items_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_payroll_items_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_payroll_items_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "company_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_payroll_items_payroll_id_fkey"
            columns: ["payroll_id"]
            referencedRelation: "company_payrolls"
            referencedColumns: ["id"]
          },
        ]
      }
      company_payrolls: {
        Row: {
          company_id: string
          created_at: string
          dispersed_at: string | null
          employees_count: number
          end_date: string
          id: string
          notes: string | null
          payout_date: string
          period_name: string
          period_type: string
          start_date: string
          status: string
          total_bonuses: number
          total_deductions: number
          total_gross: number
          total_net: number
          total_overtime: number
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          company_id: string
          created_at?: string
          dispersed_at?: string | null
          employees_count?: number
          end_date: string
          id?: string
          notes?: string | null
          payout_date: string
          period_name: string
          period_type?: string
          start_date: string
          status?: string
          total_bonuses?: number
          total_deductions?: number
          total_gross?: number
          total_net?: number
          total_overtime?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          dispersed_at?: string | null
          employees_count?: number
          end_date?: string
          id?: string
          notes?: string | null
          payout_date?: string
          period_name?: string
          period_type?: string
          start_date?: string
          status?: string
          total_bonuses?: number
          total_deductions?: number
          total_gross?: number
          total_net?: number
          total_overtime?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_payrolls_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_payrolls_company_id_fkey"
            columns: ["company_id"]
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
        ComputedFields: never
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
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "profiles"
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
          updated_at: string
          vacancy_id: string | null
        }
        ComputedFields: never
        Insert: {
          candidate_id: string
          created_at?: string
          id?: string
          initiated_by?: string
          recruiter_id: string
          status?: string
          updated_at?: string
          vacancy_id?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          id?: string
          initiated_by?: string
          recruiter_id?: string
          status?: string
          updated_at?: string
          vacancy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_recruiter_id_fkey"
            columns: ["recruiter_id"]
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_recruiter_id_fkey"
            columns: ["recruiter_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_vacancy_id_fkey"
            columns: ["vacancy_id"]
            referencedRelation: "vacancies"
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
        ComputedFields: never
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
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_requests_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_requests_candidate_id_fkey"
            columns: ["candidate_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_requests_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_access_requests_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_invitations: {
        Row: {
          accepted_at: string | null
          company_id: string
          contract_type: string | null
          created_at: string
          created_by: string | null
          email: string
          employee_id: string | null
          expires_at: string
          full_name: string
          hire_date: string | null
          id: string
          position: string
          salary: number | null
          status: string
          token_hash: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          accepted_at?: string | null
          company_id: string
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          email: string
          employee_id?: string | null
          expires_at?: string
          full_name: string
          hire_date?: string | null
          id?: string
          position: string
          salary?: number | null
          status?: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          email?: string
          employee_id?: string | null
          expires_at?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          position?: string
          salary?: number | null
          status?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_invitations_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_invitations_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_invitations_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_invitations_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_invitations_employee_id_fkey"
            columns: ["employee_id"]
            referencedRelation: "company_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      job_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
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
        ComputedFields: never
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
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
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
        ComputedFields: never
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
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_documents_owner_id_fkey"
            columns: ["owner_id"]
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
        ComputedFields: never
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
        ComputedFields: never
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
            referencedRelation: "candidate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_vacancies_vacancy_id_fkey"
            columns: ["vacancy_id"]
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
        ]
      }
      skills_catalog: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
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
        ComputedFields: never
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
            foreignKeyName: "support_ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
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
        ComputedFields: never
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
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: NonNullable<Json>
        }
        ComputedFields: never
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: NonNullable<Json>
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: NonNullable<Json>
        }
        Relationships: []
      }
      vacancies: {
        Row: {
          benefits: string[] | null
          category: string
          category_id: string | null
          company_id: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          description: string
          education_level: string
          employment_type: string
          experience_required: string
          expires_at: string | null
          featured_until: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_promoted: boolean
          location: string
          modality: string
          payment_frequency: string
          positions_available: number
          preferred_contact_method: string
          recruiter_id: string
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          shift_schedule: string
          skills: string[] | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          zone: string
          zone_id: string | null
        }
        ComputedFields: never
        Insert: {
          benefits?: string[] | null
          category: string
          category_id?: string | null
          company_id: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          description: string
          education_level?: string
          employment_type: string
          experience_required?: string
          expires_at?: string | null
          featured_until?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_promoted?: boolean
          location?: string
          modality?: string
          payment_frequency?: string
          positions_available?: number
          preferred_contact_method?: string
          recruiter_id: string
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          shift_schedule?: string
          skills?: string[] | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          zone: string
          zone_id?: string | null
        }
        Update: {
          benefits?: string[] | null
          category?: string
          category_id?: string | null
          company_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          description?: string
          education_level?: string
          employment_type?: string
          experience_required?: string
          expires_at?: string | null
          featured_until?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_promoted?: boolean
          location?: string
          modality?: string
          payment_frequency?: string
          positions_available?: number
          preferred_contact_method?: string
          recruiter_id?: string
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          shift_schedule?: string
          skills?: string[] | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          zone?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacancies_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancies_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancies_company_id_fkey"
            columns: ["company_id"]
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancies_recruiter_id_fkey"
            columns: ["recruiter_id"]
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancies_recruiter_id_fkey"
            columns: ["recruiter_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancies_zone_id_fkey"
            columns: ["zone_id"]
            referencedRelation: "work_zones"
            referencedColumns: ["id"]
          },
        ]
      }
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
        ComputedFields: never
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
            foreignKeyName: "vacancy_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancy_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancy_reports_vacancy_id_fkey"
            columns: ["vacancy_id"]
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
        ]
      }
      work_zones: {
        Row: {
          city: string
          created_at: string
          id: string
          name: string
          state: string
        }
        ComputedFields: never
        Insert: {
          city?: string
          created_at?: string
          id?: string
          name: string
          state?: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          name?: string
          state?: string
        }
        Relationships: []
      }
    }
    Views: {
      candidate_directory: {
        Row: {
          avatar_url: string | null
          bio: string | null
          candidate_type: Database["public"]["Enums"]["candidate_type"] | null
          education: Json | null
          experience: Json | null
          full_name: string | null
          headline: string | null
          id: string | null
          is_verified: boolean | null
          location: string | null
          preferred_zone: string | null
          skills: string[] | null
          specialization_area: string | null
          trade_description: string | null
          years_experience: number | null
        }
        ComputedFields: never
        Relationships: []
      }
      company_directory: {
        Row: {
          banner_url: string | null
          company_name: string | null
          company_size: string | null
          description: string | null
          id: string | null
          industry: string | null
          logo_url: string | null
          social_links: Json | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website_url: string | null
        }
        ComputedFields: never
        Insert: {
          banner_url?: string | null
          company_name?: string | null
          company_size?: string | null
          description?: string | null
          id?: string | null
          industry?: string | null
          logo_url?: string | null
          social_links?: Json | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website_url?: string | null
        }
        Update: {
          banner_url?: string | null
          company_name?: string | null
          company_size?: string | null
          description?: string | null
          id?: string | null
          industry?: string | null
          logo_url?: string | null
          social_links?: Json | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "candidate_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
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
      employee_status:
        | "pending"
        | "onboarding"
        | "active"
        | "suspended"
        | "terminated"
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
      employee_status: [
        "pending",
        "onboarding",
        "active",
        "suspended",
        "terminated",
      ],
      user_role: ["candidate", "company", "admin"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
