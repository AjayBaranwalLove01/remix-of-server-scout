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
      locations_master: {
        Row: {
          created_at: string
          id: string
          location_name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      os_master: {
        Row: {
          created_at: string
          id: string
          os_name: string
          os_support_end_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          os_name: string
          os_support_end_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          os_name?: string
          os_support_end_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      server_general_details: {
        Row: {
          affected_groups: Json
          alive: string
          backup_details_url: string
          build_date: string
          build_engineer: string
          business_function: string
          created_at: string
          design_engineer: string
          domain: string
          id: string
          ilo: string
          internet_facing: string
          ip_address: string
          is_patched: string
          location: string
          model: string
          network: string
          notes: string
          os: string
          os_support_end_date: string
          patch_contact: string
          pci_asset: string
          primary_group_id: string | null
          serial_number: string
          server_description: string
          servername: string
          soci_asset: string
          software_installed_url: string
          status: string
          updated_at: string
        }
        Insert: {
          affected_groups?: Json
          alive?: string
          backup_details_url?: string
          build_date?: string
          build_engineer?: string
          business_function?: string
          created_at?: string
          design_engineer?: string
          domain?: string
          id: string
          ilo?: string
          internet_facing?: string
          ip_address?: string
          is_patched?: string
          location?: string
          model?: string
          network?: string
          notes?: string
          os?: string
          os_support_end_date?: string
          patch_contact?: string
          pci_asset?: string
          primary_group_id?: string | null
          serial_number?: string
          server_description?: string
          servername: string
          soci_asset?: string
          software_installed_url?: string
          status?: string
          updated_at?: string
        }
        Update: {
          affected_groups?: Json
          alive?: string
          backup_details_url?: string
          build_date?: string
          build_engineer?: string
          business_function?: string
          created_at?: string
          design_engineer?: string
          domain?: string
          id?: string
          ilo?: string
          internet_facing?: string
          ip_address?: string
          is_patched?: string
          location?: string
          model?: string
          network?: string
          notes?: string
          os?: string
          os_support_end_date?: string
          patch_contact?: string
          pci_asset?: string
          primary_group_id?: string | null
          serial_number?: string
          server_description?: string
          servername?: string
          soci_asset?: string
          software_installed_url?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      server_summary: {
        Row: {
          cpu_usage: string
          created_at: string
          day: string
          disk_usage: string
          essential8: string
          last_collated: string
          last_scan_date: string
          maintenance_comment: string
          memory_usage: string
          monitoring_summary: string
          patch_category: string
          patch_notes: string
          patch_sequence: string
          patch_summary: string
          priority: string
          servername: string
          time: string
          updated_at: string
          uptime: string
        }
        Insert: {
          cpu_usage?: string
          created_at?: string
          day?: string
          disk_usage?: string
          essential8?: string
          last_collated?: string
          last_scan_date?: string
          maintenance_comment?: string
          memory_usage?: string
          monitoring_summary?: string
          patch_category?: string
          patch_notes?: string
          patch_sequence?: string
          patch_summary?: string
          priority?: string
          servername: string
          time?: string
          updated_at?: string
          uptime?: string
        }
        Update: {
          cpu_usage?: string
          created_at?: string
          day?: string
          disk_usage?: string
          essential8?: string
          last_collated?: string
          last_scan_date?: string
          maintenance_comment?: string
          memory_usage?: string
          monitoring_summary?: string
          patch_category?: string
          patch_notes?: string
          patch_sequence?: string
          patch_summary?: string
          priority?: string
          servername?: string
          time?: string
          updated_at?: string
          uptime?: string
        }
        Relationships: []
      }
      servers_legacy_backup: {
        Row: {
          affected_groups: Json
          alive: string
          backup_details_url: string
          build_date: string
          build_engineer: string
          business_function: string
          created_at: string
          day: string
          design_engineer: string
          domain: string
          essential8: string
          id: string
          ilo: string
          internet_facing: string
          ip_address: string
          is_patched: string
          last_collated: string
          location: string
          maintenance_comment: string
          model: string
          network: string
          notes: string
          os: string
          os_support_ends: string
          patch_category: string
          patch_contact: string
          patch_notes: string
          patch_sequence: string
          pci_asset: string
          primary_group_id: string | null
          priority: string
          serial_number: string
          server_description: string
          server_name: string
          soci_asset: string
          software_installed_url: string
          status: string
          time: string
          updated_at: string
        }
        Insert: {
          affected_groups?: Json
          alive?: string
          backup_details_url?: string
          build_date?: string
          build_engineer?: string
          business_function?: string
          created_at?: string
          day?: string
          design_engineer?: string
          domain?: string
          essential8?: string
          id: string
          ilo?: string
          internet_facing?: string
          ip_address?: string
          is_patched?: string
          last_collated?: string
          location?: string
          maintenance_comment?: string
          model?: string
          network?: string
          notes?: string
          os?: string
          os_support_ends?: string
          patch_category?: string
          patch_contact?: string
          patch_notes?: string
          patch_sequence?: string
          pci_asset?: string
          primary_group_id?: string | null
          priority?: string
          serial_number?: string
          server_description?: string
          server_name: string
          soci_asset?: string
          software_installed_url?: string
          status?: string
          time?: string
          updated_at?: string
        }
        Update: {
          affected_groups?: Json
          alive?: string
          backup_details_url?: string
          build_date?: string
          build_engineer?: string
          business_function?: string
          created_at?: string
          day?: string
          design_engineer?: string
          domain?: string
          essential8?: string
          id?: string
          ilo?: string
          internet_facing?: string
          ip_address?: string
          is_patched?: string
          last_collated?: string
          location?: string
          maintenance_comment?: string
          model?: string
          network?: string
          notes?: string
          os?: string
          os_support_ends?: string
          patch_category?: string
          patch_contact?: string
          patch_notes?: string
          patch_sequence?: string
          pci_asset?: string
          primary_group_id?: string | null
          priority?: string
          serial_number?: string
          server_description?: string
          server_name?: string
          soci_asset?: string
          software_installed_url?: string
          status?: string
          time?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_groups: {
        Row: {
          created_at: string
          id: string
          manager: string
          members: string[]
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          manager: string
          members?: string[]
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          manager?: string
          members?: string[]
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      servers: {
        Row: {
          affected_groups: Json | null
          alive: string | null
          backup_details_url: string | null
          build_date: string | null
          build_engineer: string | null
          business_function: string | null
          cpu_usage: string | null
          created_at: string | null
          day: string | null
          design_engineer: string | null
          disk_usage: string | null
          domain: string | null
          essential8: string | null
          id: string | null
          ilo: string | null
          internet_facing: string | null
          ip_address: string | null
          is_patched: string | null
          last_collated: string | null
          last_scan_date: string | null
          location: string | null
          maintenance_comment: string | null
          memory_usage: string | null
          model: string | null
          monitoring_summary: string | null
          network: string | null
          notes: string | null
          os: string | null
          os_support_ends: string | null
          patch_category: string | null
          patch_contact: string | null
          patch_notes: string | null
          patch_sequence: string | null
          patch_summary: string | null
          pci_asset: string | null
          primary_group_id: string | null
          priority: string | null
          serial_number: string | null
          server_description: string | null
          server_name: string | null
          servername: string | null
          soci_asset: string | null
          software_installed_url: string | null
          status: string | null
          time: string | null
          updated_at: string | null
          uptime: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
