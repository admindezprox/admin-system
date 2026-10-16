/**
 * Supabase Database Type Definitions for Dezprox Admin Panel
 *
 * Authoritative schema based on database migration:
 * supabase/migrations/20261015000000_initial_founder_and_enquiry_schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type FounderRole = "founder" | "super_admin";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "rescheduled"
  | "cancelled"
  | "completed";

export type ContactEnquiryStatus =
  | "new"
  | "in_review"
  | "responded"
  | "archived"
  | "spam";

export type ServiceCategory =
  | "custom_software"
  | "web_development"
  | "ui_ux_design"
  | "mobile_apps"
  | "graphic_design"
  | "marketing_growth"
  | "erp_lms_systems"
  | "other";

export type BudgetTier = "starter" | "growth" | "scale" | "custom";

export type ServiceEnquiryStatus =
  | "new"
  | "contacted"
  | "discovery_scheduled"
  | "proposal_sent"
  | "closed_won"
  | "closed_lost"
  | "archived";

export type UserAgentCategory =
  | "desktop"
  | "mobile"
  | "tablet"
  | "bot"
  | "unknown";

export interface Database {
  public: {
    Tables: {
      founder_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: FounderRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: FounderRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: FounderRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_requests: {
        Row: {
          id: string;
          email: string;
          phone: string;
          requested_date: string;
          requested_time_slot: string;
          notes: string | null;
          status: BookingStatus;
          internal_notes: string | null;
          confirmed_by: string | null;
          confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          phone: string;
          requested_date: string;
          requested_time_slot: string;
          notes?: string | null;
          status?: BookingStatus;
          internal_notes?: string | null;
          confirmed_by?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string;
          requested_date?: string;
          requested_time_slot?: string;
          notes?: string | null;
          status?: BookingStatus;
          internal_notes?: string | null;
          confirmed_by?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_requests_confirmed_by_fkey";
            columns: ["confirmed_by"];
            isOneToOne: false;
            referencedRelation: "founder_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_enquiries: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          company_name: string | null;
          subject: string | null;
          message: string;
          status: ContactEnquiryStatus;
          internal_notes: string | null;
          responded_by: string | null;
          responded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone?: string | null;
          company_name?: string | null;
          subject?: string | null;
          message: string;
          status?: ContactEnquiryStatus;
          internal_notes?: string | null;
          responded_by?: string | null;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          company_name?: string | null;
          subject?: string | null;
          message?: string;
          status?: ContactEnquiryStatus;
          internal_notes?: string | null;
          responded_by?: string | null;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_enquiries_responded_by_fkey";
            columns: ["responded_by"];
            isOneToOne: false;
            referencedRelation: "founder_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      service_enquiries: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          company_name: string | null;
          service_category: ServiceCategory;
          budget_tier: BudgetTier | null;
          project_description: string;
          estimated_timeline: string | null;
          status: ServiceEnquiryStatus;
          internal_notes: string | null;
          assigned_founder: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone?: string | null;
          company_name?: string | null;
          service_category: ServiceCategory;
          budget_tier?: BudgetTier | null;
          project_description: string;
          estimated_timeline?: string | null;
          status?: ServiceEnquiryStatus;
          internal_notes?: string | null;
          assigned_founder?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          company_name?: string | null;
          service_category?: ServiceCategory;
          budget_tier?: BudgetTier | null;
          project_description?: string;
          estimated_timeline?: string | null;
          status?: ServiceEnquiryStatus;
          internal_notes?: string | null;
          assigned_founder?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_enquiries_assigned_founder_fkey";
            columns: ["assigned_founder"];
            isOneToOne: false;
            referencedRelation: "founder_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      cookie_consents: {
        Row: {
          id: string;
          anonymous_session_id: string;
          consent_version: string;
          essential: boolean;
          analytics: boolean;
          marketing: boolean;
          user_agent_category: UserAgentCategory | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          anonymous_session_id: string;
          consent_version?: string;
          essential?: boolean;
          analytics?: boolean;
          marketing?: boolean;
          user_agent_category?: UserAgentCategory | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          anonymous_session_id?: string;
          consent_version?: string;
          essential?: boolean;
          analytics?: boolean;
          marketing?: boolean;
          user_agent_category?: UserAgentCategory | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_active_founder: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
