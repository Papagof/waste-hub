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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      billing_plans: {
        Row: {
          amount_kobo: number
          created_at: string
          currency: string
          cycle_type: Database["public"]["Enums"]["billing_cycle"]
          discount_percent: number
          grace_period_days: number
          id: string
          is_active: boolean
          late_fee_kobo: number
          name: string
          updated_at: string
        }
        Insert: {
          amount_kobo: number
          created_at?: string
          currency?: string
          cycle_type: Database["public"]["Enums"]["billing_cycle"]
          discount_percent?: number
          grace_period_days?: number
          id?: string
          is_active?: boolean
          late_fee_kobo?: number
          name: string
          updated_at?: string
        }
        Update: {
          amount_kobo?: number
          created_at?: string
          currency?: string
          cycle_type?: Database["public"]["Enums"]["billing_cycle"]
          discount_percent?: number
          grace_period_days?: number
          id?: string
          is_active?: boolean
          late_fee_kobo?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      collection_logs: {
        Row: {
          collection_date: string
          collector_id: string | null
          community_id: string
          created_at: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["collection_status"]
        }
        Insert: {
          collection_date?: string
          collector_id?: string | null
          community_id: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["collection_status"]
        }
        Update: {
          collection_date?: string
          collector_id?: string | null
          community_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["collection_status"]
        }
        Relationships: [
          {
            foreignKeyName: "collection_logs_collector_id_fkey"
            columns: ["collector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_logs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_logs_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_payment_summary"
            referencedColumns: ["community_id"]
          },
        ]
      }
      communities: {
        Row: {
          address: string | null
          collection_days: string[]
          created_at: string
          default_billing_plan_id: string | null
          id: string
          name: string
          updated_at: string
          zone: string | null
        }
        Insert: {
          address?: string | null
          collection_days?: string[]
          created_at?: string
          default_billing_plan_id?: string | null
          id?: string
          name: string
          updated_at?: string
          zone?: string | null
        }
        Update: {
          address?: string | null
          collection_days?: string[]
          created_at?: string
          default_billing_plan_id?: string | null
          id?: string
          name?: string
          updated_at?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communities_default_billing_plan_id_fkey"
            columns: ["default_billing_plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communities_default_billing_plan_id_fkey"
            columns: ["default_billing_plan_id"]
            isOneToOne: false
            referencedRelation: "resident_payment_status"
            referencedColumns: ["billing_plan_id"]
          },
        ]
      }
      community_staff: {
        Row: {
          community_id: string
          created_at: string
          id: string
          profile_id: string
          staff_role: Database["public"]["Enums"]["staff_role"]
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          profile_id: string
          staff_role: Database["public"]["Enums"]["staff_role"]
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          profile_id?: string
          staff_role?: Database["public"]["Enums"]["staff_role"]
        }
        Relationships: [
          {
            foreignKeyName: "community_staff_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_staff_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_payment_summary"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "community_staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_audit_log: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          payment_id: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          payment_id: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_audit_log_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_kobo: number
          amount_paid_kobo: number
          billing_plan_id: string
          created_at: string
          currency: string
          gateway: Database["public"]["Enums"]["payment_gateway"]
          gateway_reference: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          payment_date: string | null
          period_end: string
          period_start: string
          receipt_number: string | null
          recorded_by: string | null
          resident_id: string
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_kobo: number
          amount_paid_kobo?: number
          billing_plan_id: string
          created_at?: string
          currency?: string
          gateway?: Database["public"]["Enums"]["payment_gateway"]
          gateway_reference?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string | null
          period_end: string
          period_start: string
          receipt_number?: string | null
          recorded_by?: string | null
          resident_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_kobo?: number
          amount_paid_kobo?: number
          billing_plan_id?: string
          created_at?: string
          currency?: string
          gateway?: Database["public"]["Enums"]["payment_gateway"]
          gateway_reference?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string | null
          period_end?: string
          period_start?: string
          receipt_number?: string | null
          recorded_by?: string | null
          resident_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_billing_plan_id_fkey"
            columns: ["billing_plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_billing_plan_id_fkey"
            columns: ["billing_plan_id"]
            isOneToOne: false
            referencedRelation: "resident_payment_status"
            referencedColumns: ["billing_plan_id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "resident_payment_status"
            referencedColumns: ["resident_id"]
          },
          {
            foreignKeyName: "payments_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      residents: {
        Row: {
          billing_plan_id: string
          community_id: string
          created_at: string
          email: string | null
          full_name: string
          house_unit_number: string
          id: string
          join_date: string
          phone: string | null
          profile_id: string | null
          status: Database["public"]["Enums"]["resident_status"]
          updated_at: string
          virtual_account_bank: string | null
          virtual_account_number: string | null
        }
        Insert: {
          billing_plan_id: string
          community_id: string
          created_at?: string
          email?: string | null
          full_name: string
          house_unit_number: string
          id?: string
          join_date?: string
          phone?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["resident_status"]
          updated_at?: string
          virtual_account_bank?: string | null
          virtual_account_number?: string | null
        }
        Update: {
          billing_plan_id?: string
          community_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          house_unit_number?: string
          id?: string
          join_date?: string
          phone?: string | null
          profile_id?: string | null
          status?: Database["public"]["Enums"]["resident_status"]
          updated_at?: string
          virtual_account_bank?: string | null
          virtual_account_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "residents_billing_plan_id_fkey"
            columns: ["billing_plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residents_billing_plan_id_fkey"
            columns: ["billing_plan_id"]
            isOneToOne: false
            referencedRelation: "resident_payment_status"
            referencedColumns: ["billing_plan_id"]
          },
          {
            foreignKeyName: "residents_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residents_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_payment_summary"
            referencedColumns: ["community_id"]
          },
          {
            foreignKeyName: "residents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      community_payment_summary: {
        Row: {
          active_residents: number | null
          community_id: string | null
          community_name: string | null
          grace_period_residents: number | null
          overdue_residents: number | null
          revenue_this_month_kobo: number | null
          total_residents: number | null
        }
        Relationships: []
      }
      resident_payment_status: {
        Row: {
          amount_kobo: number | null
          billing_plan_id: string | null
          community_id: string | null
          compliance_status: string | null
          cycle_type: Database["public"]["Enums"]["billing_cycle"] | null
          full_name: string | null
          grace_deadline: string | null
          grace_period_days: number | null
          last_paid_period_end: string | null
          next_due_date: string | null
          resident_id: string | null
          resident_status: Database["public"]["Enums"]["resident_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "residents_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residents_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "community_payment_summary"
            referencedColumns: ["community_id"]
          },
        ]
      }
    }
    Functions: {
      billing_cycle_months: {
        Args: { cycle: Database["public"]["Enums"]["billing_cycle"] }
        Returns: number
      }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_super_admin: { Args: never; Returns: boolean }
      staff_community_ids: {
        Args: { required_role: Database["public"]["Enums"]["staff_role"] }
        Returns: string[]
      }
    }
    Enums: {
      billing_cycle:
        | "monthly"
        | "bi_monthly"
        | "quarterly"
        | "half_yearly"
        | "yearly"
      collection_status: "completed" | "missed" | "rescheduled"
      payment_gateway: "paystack" | "flutterwave" | "manual"
      payment_method:
        | "cash"
        | "card"
        | "bank_transfer"
        | "mobile_money"
        | "ussd"
      payment_status:
        | "paid"
        | "pending"
        | "overdue"
        | "partial"
        | "failed"
        | "refunded"
      resident_status: "active" | "inactive" | "suspended"
      staff_role: "manager" | "collector"
      user_role:
        | "super_admin"
        | "community_manager"
        | "field_agent"
        | "resident"
        | "accountant"
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
      billing_cycle: [
        "monthly",
        "bi_monthly",
        "quarterly",
        "half_yearly",
        "yearly",
      ],
      collection_status: ["completed", "missed", "rescheduled"],
      payment_gateway: ["paystack", "flutterwave", "manual"],
      payment_method: ["cash", "card", "bank_transfer", "mobile_money", "ussd"],
      payment_status: [
        "paid",
        "pending",
        "overdue",
        "partial",
        "failed",
        "refunded",
      ],
      resident_status: ["active", "inactive", "suspended"],
      staff_role: ["manager", "collector"],
      user_role: [
        "super_admin",
        "community_manager",
        "field_agent",
        "resident",
        "accountant",
      ],
    },
  },
} as const
