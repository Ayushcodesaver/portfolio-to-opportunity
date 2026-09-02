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
      achievements: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          key: string
          name: string
          points: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          key: string
          name: string
          points?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          key?: string
          name?: string
          points?: number | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          created_at: string | null
          feature: string
          id: string
          tokens: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature: string
          id?: string
          tokens?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature?: string
          id?: string
          tokens?: number | null
          user_id?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string | null
          date: string
          id: string
          intern_id: string
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          intern_id: string
          notes?: string | null
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          intern_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string
          body: string
          category_id: string | null
          cover_image_url: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["blog_status"]
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author_id: string
          body?: string
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["blog_status"]
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author_id?: string
          body?: string
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["blog_status"]
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_code: string
          created_at: string
          holder_name: string
          id: string
          intern_id: string
          issued_at: string
          metadata: Json
          pdf_url: string | null
          plan_tier: string
          program_id: string | null
          program_title: string
          verified: boolean
        }
        Insert: {
          certificate_code: string
          created_at?: string
          holder_name: string
          id?: string
          intern_id: string
          issued_at?: string
          metadata?: Json
          pdf_url?: string | null
          plan_tier?: string
          program_id?: string | null
          program_title: string
          verified?: boolean
        }
        Update: {
          certificate_code?: string
          created_at?: string
          holder_name?: string
          id?: string
          intern_id?: string
          issued_at?: string
          metadata?: Json
          pdf_url?: string | null
          plan_tier?: string
          program_id?: string | null
          program_title?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "certificates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "internship_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_messages: {
        Row: {
          attachment_url: string | null
          channel_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          channel_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_private: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_requirement_versions: {
        Row: {
          change_note: string | null
          changed_by: string | null
          content: string
          created_at: string | null
          description: string | null
          id: string
          requirement_id: string
          title: string
          version: number
        }
        Insert: {
          change_note?: string | null
          changed_by?: string | null
          content: string
          created_at?: string | null
          description?: string | null
          id?: string
          requirement_id: string
          title: string
          version: number
        }
        Update: {
          change_note?: string | null
          changed_by?: string | null
          content?: string
          created_at?: string | null
          description?: string | null
          id?: string
          requirement_id?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_requirement_versions_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "client_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      client_requirements: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      daily_streaks: {
        Row: {
          current_streak: number
          last_check_in: string | null
          longest_streak: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_streak?: number
          last_check_in?: string | null
          longest_streak?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_streak?: number
          last_check_in?: string | null
          longest_streak?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          attachment_url: string | null
          created_at: string | null
          created_by: string | null
          day_number: number
          deadline_at: string | null
          description: string | null
          id: string
          points: number | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          program_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string | null
          created_by?: string | null
          day_number: number
          deadline_at?: string | null
          description?: string | null
          id?: string
          points?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          program_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          attachment_url?: string | null
          created_at?: string | null
          created_by?: string | null
          day_number?: number
          deadline_at?: string | null
          description?: string | null
          id?: string
          points?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          program_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "internship_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          code_quality: number | null
          comments: string | null
          communication: number | null
          created_at: string | null
          hr_id: string
          id: string
          improvements: string[] | null
          initiative: number | null
          intern_id: string
          problem_solving: number | null
          recommendation: string | null
          strengths: string[] | null
          teamwork: number | null
        }
        Insert: {
          code_quality?: number | null
          comments?: string | null
          communication?: number | null
          created_at?: string | null
          hr_id: string
          id?: string
          improvements?: string[] | null
          initiative?: number | null
          intern_id: string
          problem_solving?: number | null
          recommendation?: string | null
          strengths?: string[] | null
          teamwork?: number | null
        }
        Update: {
          code_quality?: number | null
          comments?: string | null
          communication?: number | null
          created_at?: string | null
          hr_id?: string
          id?: string
          improvements?: string[] | null
          initiative?: number | null
          intern_id?: string
          problem_solving?: number | null
          recommendation?: string | null
          strengths?: string[] | null
          teamwork?: number | null
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      global_notifications: {
        Row: {
          body: string
          category: string | null
          created_at: string | null
          created_by: string | null
          id: string
          link: string | null
          priority: Database["public"]["Enums"]["notif_priority"] | null
          title: string
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          link?: string | null
          priority?: Database["public"]["Enums"]["notif_priority"] | null
          title: string
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          link?: string | null
          priority?: Database["public"]["Enums"]["notif_priority"] | null
          title?: string
        }
        Relationships: []
      }
      internship_programs: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          start_date: string
          title: string
          total_days: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          start_date: string
          title: string
          total_days: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          start_date?: string
          title?: string
          total_days?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "global_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_inr: number
          cashfree_order_id: string | null
          cashfree_payment_id: string | null
          created_at: string
          id: string
          plan_id: string
          raw: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_inr: number
          cashfree_order_id?: string | null
          cashfree_payment_id?: string | null
          created_at?: string
          id?: string
          plan_id: string
          raw?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_inr?: number
          cashfree_order_id?: string | null
          cashfree_payment_id?: string | null
          created_at?: string
          id?: string
          plan_id?: string
          raw?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          duration_months: number
          features: Json
          id: string
          is_popular: boolean
          name: string
          price_inr: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          duration_months: number
          features?: Json
          id: string
          is_popular?: boolean
          name: string
          price_inr: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          duration_months?: number
          features?: Json
          id?: string
          is_popular?: boolean
          name?: string
          price_inr?: number
          sort_order?: number
        }
        Relationships: []
      }
      points_history: {
        Row: {
          created_at: string | null
          id: string
          intern_id: string
          points: number
          reason: string
          source_id: string | null
          source_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intern_id: string
          points: number
          reason: string
          source_id?: string | null
          source_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intern_id?: string
          points?: number
          reason?: string
          source_id?: string | null
          source_type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string
          github_url: string | null
          id: string
          internship_end: string | null
          internship_start: string | null
          internship_type: Database["public"]["Enums"]["internship_type"] | null
          is_banned: boolean | null
          linkedin_url: string | null
          location: string | null
          notification_prefs: Json
          portfolio_goal: Database["public"]["Enums"]["portfolio_goal"] | null
          skills: string[] | null
          twitter_url: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name: string
          github_url?: string | null
          id: string
          internship_end?: string | null
          internship_start?: string | null
          internship_type?:
            | Database["public"]["Enums"]["internship_type"]
            | null
          is_banned?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          notification_prefs?: Json
          portfolio_goal?: Database["public"]["Enums"]["portfolio_goal"] | null
          skills?: string[] | null
          twitter_url?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string
          github_url?: string | null
          id?: string
          internship_end?: string | null
          internship_start?: string | null
          internship_type?:
            | Database["public"]["Enums"]["internship_type"]
            | null
          is_banned?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          notification_prefs?: Json
          portfolio_goal?: Database["public"]["Enums"]["portfolio_goal"] | null
          skills?: string[] | null
          twitter_url?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      program_enrollments: {
        Row: {
          current_day: number | null
          id: string
          intern_id: string
          joined_at: string | null
          points: number | null
          program_id: string
        }
        Insert: {
          current_day?: number | null
          id?: string
          intern_id: string
          joined_at?: string | null
          points?: number | null
          program_id: string
        }
        Update: {
          current_day?: number | null
          id?: string
          intern_id?: string
          joined_at?: string | null
          points?: number | null
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "internship_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      project_likes: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_likes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_saves: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_saves_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          demo_url: string | null
          description: string
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          github_url: string | null
          id: string
          is_team: boolean | null
          media_url: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          tags: string[] | null
          team_members: string[] | null
          title: string
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          created_at?: string | null
          demo_url?: string | null
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          github_url?: string | null
          id?: string
          is_team?: boolean | null
          media_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          tags?: string[] | null
          team_members?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          created_at?: string | null
          demo_url?: string | null
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          github_url?: string | null
          id?: string
          is_team?: boolean | null
          media_url?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          tags?: string[] | null
          team_members?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          file_name: string
          file_path: string
          file_size: number
          file_url: string
          id: string
          is_default: boolean
          mime_type: string
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size: number
          file_url: string
          id?: string
          is_default?: boolean
          mime_type: string
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number
          file_url?: string
          id?: string
          is_default?: boolean
          mime_type?: string
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          payment_id: string | null
          plan_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          payment_id?: string | null
          plan_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          payment_id?: string | null
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      task_submissions: {
        Row: {
          content: string | null
          feedback: string | null
          file_url: string | null
          id: string
          intern_id: string
          points_awarded: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          submission_url: string | null
          submitted_at: string | null
          task_id: string
        }
        Insert: {
          content?: string | null
          feedback?: string | null
          file_url?: string | null
          id?: string
          intern_id: string
          points_awarded?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          submission_url?: string | null
          submitted_at?: string | null
          task_id: string
        }
        Update: {
          content?: string | null
          feedback?: string | null
          file_url?: string | null
          id?: string
          intern_id?: string
          points_awarded?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          submission_url?: string | null
          submitted_at?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_submissions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          sender_id: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          sender_id: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string | null
          description: string
          hr_id: string | null
          id: string
          intern_id: string
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          hr_id?: string | null
          id?: string
          intern_id: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          hr_id?: string | null
          id?: string
          intern_id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ui_assets: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          kind: string
          name: string
          opacity: number
          page: string
          position: string
          sort_order: number
          storage_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          name: string
          opacity?: number
          page?: string
          position?: string
          sort_order?: number
          storage_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          opacity?: number
          page?: string
          position?: string
          sort_order?: number
          storage_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_key: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_v: {
        Row: {
          badges_count: number | null
          monthly_points: number | null
          total_points: number | null
          user_id: string | null
          weekly_points: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_achievement: {
        Args: { _key: string; _user: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_streak: {
        Args: never
        Returns: {
          current_streak: number
          last_check_in: string | null
          longest_streak: number
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "daily_streaks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "intern" | "hr" | "admin"
      attendance_status: "present" | "absent" | "late" | "leave" | "holiday"
      blog_status: "draft" | "published" | "archived"
      difficulty_level: "beginner" | "intermediate" | "advanced"
      internship_type: "summer" | "winter" | "full_time"
      notif_priority: "low" | "medium" | "high" | "urgent"
      portfolio_goal:
        | "frontend"
        | "backend"
        | "fullstack"
        | "mobile"
        | "data"
        | "devops"
      project_status: "draft" | "pending" | "approved" | "rejected"
      task_priority: "low" | "medium" | "high"
      task_status: "pending" | "submitted" | "approved" | "rejected"
      ticket_priority: "low" | "medium" | "high"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
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
      app_role: ["intern", "hr", "admin"],
      attendance_status: ["present", "absent", "late", "leave", "holiday"],
      blog_status: ["draft", "published", "archived"],
      difficulty_level: ["beginner", "intermediate", "advanced"],
      internship_type: ["summer", "winter", "full_time"],
      notif_priority: ["low", "medium", "high", "urgent"],
      portfolio_goal: [
        "frontend",
        "backend",
        "fullstack",
        "mobile",
        "data",
        "devops",
      ],
      project_status: ["draft", "pending", "approved", "rejected"],
      task_priority: ["low", "medium", "high"],
      task_status: ["pending", "submitted", "approved", "rejected"],
      ticket_priority: ["low", "medium", "high"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
    },
  },
} as const
