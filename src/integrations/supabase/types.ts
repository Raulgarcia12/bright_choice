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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          name: string
          website_url: string | null
          logo_url: string | null
          country: string | null
          is_active: boolean
          scraper_config: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          website_url?: string | null
          logo_url?: string | null
          country?: string | null
          is_active?: boolean
          scraper_config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          website_url?: string | null
          logo_url?: string | null
          country?: string | null
          is_active?: boolean
          scraper_config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      change_logs: {
        Row: {
          id: string
          product_id: string
          product_version_id: string | null
          field_name: string
          old_value: string | null
          new_value: string | null
          detected_at: string
        }
        Insert: {
          id?: string
          product_id: string
          product_version_id?: string | null
          field_name: string
          old_value?: string | null
          new_value?: string | null
          detected_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          product_version_id?: string | null
          field_name?: string
          old_value?: string | null
          new_value?: string | null
          detected_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "change_logs_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          id: string
          product_id: string
          attribute_name: string
          attribute_value: string
          unit: string | null
          source_field_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          attribute_name: string
          attribute_value: string
          unit?: string | null
          source_field_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          attribute_name?: string
          attribute_value?: string
          unit?: string | null
          source_field_name?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_versions: {
        Row: {
          id: string
          product_id: string
          version_number: number
          snapshot: Json
          spec_hash: string
          change_summary: string | null
          captured_at: string
        }
        Insert: {
          id?: string
          product_id: string
          version_number?: number
          snapshot: Json
          spec_hash: string
          change_summary?: string | null
          captured_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          version_number?: number
          snapshot?: Json
          spec_hash?: string
          change_summary?: string | null
          captured_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_versions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string
          brand_id: string | null
          category: string
          cct: number
          cert_dlc: boolean
          cert_energy_star: boolean
          cert_ul: boolean
          created_at: string
          cri: number
          currency: string
          dimming: string | null
          efficiency: number | null
          id: string
          ip_rating: string | null
          is_recommended: boolean
          last_scraped_at: string | null
          lifespan: number
          lumens: number
          model: string
          price: number
          product_url: string | null
          region_id: string | null
          sales_channel: string
          sku: string | null
          spec_hash: string | null
          updated_at: string
          use_type: string
          voltage: string | null
          warranty: number
          watts: number
        }
        Insert: {
          brand: string
          brand_id?: string | null
          category: string
          cct: number
          cert_dlc?: boolean
          cert_energy_star?: boolean
          cert_ul?: boolean
          created_at?: string
          cri?: number
          currency?: string
          dimming?: string | null
          efficiency?: number | null
          id?: string
          ip_rating?: string | null
          is_recommended?: boolean
          last_scraped_at?: string | null
          lifespan?: number
          lumens: number
          model: string
          price: number
          product_url?: string | null
          region_id?: string | null
          sales_channel?: string
          sku?: string | null
          spec_hash?: string | null
          updated_at?: string
          use_type?: string
          voltage?: string | null
          warranty?: number
          watts: number
        }
        Update: {
          brand?: string
          brand_id?: string | null
          category?: string
          cct?: number
          cert_dlc?: boolean
          cert_energy_star?: boolean
          cert_ul?: boolean
          created_at?: string
          cri?: number
          currency?: string
          dimming?: string | null
          efficiency?: number | null
          id?: string
          ip_rating?: string | null
          is_recommended?: boolean
          last_scraped_at?: string | null
          lifespan?: number
          lumens?: number
          model?: string
          price?: number
          product_url?: string | null
          region_id?: string | null
          sales_channel?: string
          sku?: string | null
          spec_hash?: string | null
          updated_at?: string
          use_type?: string
          voltage?: string | null
          warranty?: number
          watts?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_scraped_data: {
        Row: {
          id: string
          scrape_run_id: string
          source_url: string
          content_type: string
          storage_path: string | null
          raw_json: Json | null
          scraped_at: string
        }
        Insert: {
          id?: string
          scrape_run_id: string
          source_url: string
          content_type?: string
          storage_path?: string | null
          raw_json?: Json | null
          scraped_at?: string
        }
        Update: {
          id?: string
          scrape_run_id?: string
          source_url?: string
          content_type?: string
          storage_path?: string | null
          raw_json?: Json | null
          scraped_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_scraped_data_scrape_run_id_fkey"
            columns: ["scrape_run_id"]
            isOneToOne: false
            referencedRelation: "scrape_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          abbreviation: string
          country: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          abbreviation: string
          country: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          abbreviation?: string
          country?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      scrape_runs: {
        Row: {
          id: string
          brand_id: string
          status: Database["public"]["Enums"]["scrape_status"]
          products_found: number
          products_new: number
          products_changed: number
          error_message: string | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          brand_id: string
          status?: Database["public"]["Enums"]["scrape_status"]
          products_found?: number
          products_new?: number
          products_changed?: number
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          brand_id?: string
          status?: Database["public"]["Enums"]["scrape_status"]
          products_found?: number
          products_new?: number
          products_changed?: number
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scrape_runs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "analyst" | "viewer"
      scrape_status: "pending" | "running" | "completed" | "failed"
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
      app_role: ["admin", "user"],
    },
  },
} as const
