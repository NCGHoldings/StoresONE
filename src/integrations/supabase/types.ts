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
      admin_users: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      advance_allocations: {
        Row: {
          advance_id: string
          allocated_at: string | null
          amount: number
          id: string
          invoice_id: string
        }
        Insert: {
          advance_id: string
          allocated_at?: string | null
          amount: number
          id?: string
          invoice_id: string
        }
        Update: {
          advance_id?: string
          allocated_at?: string | null
          amount?: number
          id?: string
          invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advance_allocations_advance_id_fkey"
            columns: ["advance_id"]
            isOneToOne: false
            referencedRelation: "customer_advances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advance_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_actions: {
        Row: {
          action: string
          action_date: string | null
          comment: string | null
          delegated_to: string | null
          id: string
          request_id: string
          step_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          action_date?: string | null
          comment?: string | null
          delegated_to?: string | null
          id?: string
          request_id: string
          step_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          action_date?: string | null
          comment?: string | null
          delegated_to?: string | null
          id?: string
          request_id?: string
          step_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_actions_delegated_to_fkey"
            columns: ["delegated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_actions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_actions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "approval_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_conditions: {
        Row: {
          action: string
          condition_order: number | null
          created_at: string | null
          field_path: string
          id: string
          operator: string
          route_to_role: string | null
          step_id: string
          value: Json
        }
        Insert: {
          action: string
          condition_order?: number | null
          created_at?: string | null
          field_path: string
          id?: string
          operator: string
          route_to_role?: string | null
          step_id: string
          value: Json
        }
        Update: {
          action?: string
          condition_order?: number | null
          created_at?: string | null
          field_path?: string
          id?: string
          operator?: string
          route_to_role?: string | null
          step_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "approval_conditions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "approval_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_step_id: string | null
          current_step_order: number | null
          entity_id: string
          entity_number: string | null
          entity_type: string
          escalated_at: string | null
          escalation_count: number | null
          id: string
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
          workflow_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_step_id?: string | null
          current_step_order?: number | null
          entity_id: string
          entity_number?: string | null
          entity_type: string
          escalated_at?: string | null
          escalation_count?: number | null
          id?: string
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          workflow_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_step_id?: string | null
          current_step_order?: number | null
          entity_id?: string
          entity_number?: string | null
          entity_type?: string
          escalated_at?: string | null
          escalation_count?: number | null
          id?: string
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "approval_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_steps: {
        Row: {
          approval_type: string | null
          can_skip: boolean | null
          created_at: string | null
          escalation_action: string | null
          id: string
          required_percentage: number | null
          step_name: string
          step_order: number
          timeout_hours: number | null
          workflow_id: string
        }
        Insert: {
          approval_type?: string | null
          can_skip?: boolean | null
          created_at?: string | null
          escalation_action?: string | null
          id?: string
          required_percentage?: number | null
          step_name: string
          step_order: number
          timeout_hours?: number | null
          workflow_id: string
        }
        Update: {
          approval_type?: string | null
          can_skip?: boolean | null
          created_at?: string | null
          escalation_action?: string | null
          id?: string
          required_percentage?: number | null
          step_name?: string
          step_order?: number
          timeout_hours?: number | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "approval_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_workflows: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          entity_type: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_type: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          change_type: string | null
          created_at: string | null
          document_number: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          module: string | null
          new_values: Json | null
          old_values: Json | null
          session_id: string | null
          transaction_code: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          change_type?: string | null
          created_at?: string | null
          document_number?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          module?: string | null
          new_values?: Json | null
          old_values?: Json | null
          session_id?: string | null
          transaction_code?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          change_type?: string | null
          created_at?: string | null
          document_number?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          module?: string | null
          new_values?: Json | null
          old_values?: Json | null
          session_id?: string | null
          transaction_code?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bad_debt_provisions: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          id: string
          invoice_id: string | null
          notes: string | null
          provision_date: string
          provision_number: string
          provision_type: string | null
          reason: string | null
          status: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          provision_date: string
          provision_number: string
          provision_type?: string | null
          reason?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          provision_date?: string
          provision_number?: string
          provision_type?: string | null
          reason?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bad_debt_provisions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bad_debt_provisions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string | null
          bank_name: string
          branch_name: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          current_balance: number | null
          gl_account_id: string | null
          iban: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          swift_code: string | null
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          account_type?: string | null
          bank_name: string
          branch_name?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          current_balance?: number | null
          gl_account_id?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          swift_code?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string | null
          bank_name?: string
          branch_name?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          current_balance?: number | null
          gl_account_id?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          swift_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bank_reconciliations: {
        Row: {
          adjusted_balance: number | null
          bank_account_id: string
          book_balance: number
          completed_at: string | null
          created_at: string | null
          difference: number | null
          id: string
          notes: string | null
          reconciled_by: string | null
          statement_balance: number
          statement_date: string
          status: string | null
        }
        Insert: {
          adjusted_balance?: number | null
          bank_account_id: string
          book_balance: number
          completed_at?: string | null
          created_at?: string | null
          difference?: number | null
          id?: string
          notes?: string | null
          reconciled_by?: string | null
          statement_balance: number
          statement_date: string
          status?: string | null
        }
        Update: {
          adjusted_balance?: number | null
          bank_account_id?: string
          book_balance?: number
          completed_at?: string | null
          created_at?: string | null
          difference?: number | null
          id?: string
          notes?: string | null
          reconciled_by?: string | null
          statement_balance?: number
          statement_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliations_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_reconciled: boolean | null
          payee_payer: string | null
          reconciled_at: string | null
          reconciled_by: string | null
          reference_number: string | null
          running_balance: number | null
          source_id: string | null
          source_type: string | null
          transaction_date: string
          transaction_number: string
          transaction_type: string | null
          value_date: string | null
        }
        Insert: {
          amount: number
          bank_account_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_reconciled?: boolean | null
          payee_payer?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reference_number?: string | null
          running_balance?: number | null
          source_id?: string | null
          source_type?: string | null
          transaction_date: string
          transaction_number: string
          transaction_type?: string | null
          value_date?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_reconciled?: boolean | null
          payee_payer?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          reference_number?: string | null
          running_balance?: number | null
          source_id?: string | null
          source_type?: string | null
          transaction_date?: string
          transaction_number?: string
          transaction_type?: string | null
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      blanket_order_lines: {
        Row: {
          agreed_price: number
          bo_id: string
          created_at: string | null
          id: string
          max_quantity: number | null
          notes: string | null
          product_id: string | null
          product_name: string | null
          released_quantity: number | null
          unit_of_measure: string | null
        }
        Insert: {
          agreed_price?: number
          bo_id: string
          created_at?: string | null
          id?: string
          max_quantity?: number | null
          notes?: string | null
          product_id?: string | null
          product_name?: string | null
          released_quantity?: number | null
          unit_of_measure?: string | null
        }
        Update: {
          agreed_price?: number
          bo_id?: string
          created_at?: string | null
          id?: string
          max_quantity?: number | null
          notes?: string | null
          product_id?: string | null
          product_name?: string | null
          released_quantity?: number | null
          unit_of_measure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blanket_order_lines_bo_id_fkey"
            columns: ["bo_id"]
            isOneToOne: false
            referencedRelation: "blanket_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blanket_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      blanket_orders: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          bo_number: string
          consumed_value: number | null
          contract_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          delivery_terms: string | null
          id: string
          notes: string | null
          payment_terms: string | null
          status: Database["public"]["Enums"]["blanket_order_status"] | null
          supplier_id: string
          total_value: number | null
          updated_at: string | null
          valid_from: string
          valid_to: string
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          bo_number: string
          consumed_value?: number | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          delivery_terms?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          status?: Database["public"]["Enums"]["blanket_order_status"] | null
          supplier_id: string
          total_value?: number | null
          updated_at?: string | null
          valid_from: string
          valid_to: string
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          bo_number?: string
          consumed_value?: number | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          delivery_terms?: string | null
          id?: string
          notes?: string | null
          payment_terms?: string | null
          status?: Database["public"]["Enums"]["blanket_order_status"] | null
          supplier_id?: string
          total_value?: number | null
          updated_at?: string | null
          valid_from?: string
          valid_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "blanket_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blanket_orders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blanket_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blanket_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      cheques: {
        Row: {
          amount: number
          bank_account_id: string
          cheque_date: string
          cheque_number: string
          cheque_type: string | null
          clearance_date: string | null
          created_at: string | null
          created_by: string | null
          customer_receipt_id: string | null
          id: string
          is_post_dated: boolean | null
          memo: string | null
          payee_payer: string
          post_date: string | null
          status: string | null
          vendor_payment_id: string | null
        }
        Insert: {
          amount: number
          bank_account_id: string
          cheque_date: string
          cheque_number: string
          cheque_type?: string | null
          clearance_date?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_receipt_id?: string | null
          id?: string
          is_post_dated?: boolean | null
          memo?: string | null
          payee_payer: string
          post_date?: string | null
          status?: string | null
          vendor_payment_id?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string
          cheque_date?: string
          cheque_number?: string
          cheque_type?: string | null
          clearance_date?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_receipt_id?: string | null
          id?: string
          is_post_dated?: boolean | null
          memo?: string | null
          payee_payer?: string
          post_date?: string | null
          status?: string | null
          vendor_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cheques_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          auto_renewal: boolean | null
          contract_number: string
          created_at: string | null
          currency: string | null
          description: string | null
          document_url: string | null
          end_date: string
          id: string
          notice_period_days: number | null
          signed_by: string | null
          signed_date: string | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"] | null
          supplier_id: string
          terms_conditions: string | null
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          auto_renewal?: boolean | null
          contract_number: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          document_url?: string | null
          end_date: string
          id?: string
          notice_period_days?: number | null
          signed_by?: string | null
          signed_date?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          supplier_id: string
          terms_conditions?: string | null
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          auto_renewal?: boolean | null
          contract_number?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          document_url?: string | null
          end_date?: string
          id?: string
          notice_period_days?: number | null
          signed_by?: string | null
          signed_date?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          supplier_id?: string
          terms_conditions?: string | null
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          budget: number | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          manager: string | null
          name: string
          spent: number | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager?: string | null
          name: string
          spent?: number | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager?: string | null
          name?: string
          spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credit_note_applications: {
        Row: {
          amount: number
          applied_at: string | null
          applied_by: string | null
          credit_note_id: string
          id: string
          invoice_id: string
          notes: string | null
        }
        Insert: {
          amount: number
          applied_at?: string | null
          applied_by?: string | null
          credit_note_id: string
          id?: string
          invoice_id: string
          notes?: string | null
        }
        Update: {
          amount?: number
          applied_at?: string | null
          applied_by?: string | null
          credit_note_id?: string
          id?: string
          invoice_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_note_applications_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_note_applications_credit_note_id_fkey"
            columns: ["credit_note_id"]
            isOneToOne: false
            referencedRelation: "credit_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_note_applications_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_notes: {
        Row: {
          amount: number
          amount_applied: number | null
          applied_to_invoice_id: string | null
          created_at: string | null
          created_by: string | null
          credit_date: string
          credit_note_number: string
          currency: string | null
          customer_id: string
          id: string
          invoice_id: string | null
          notes: string | null
          reason: string | null
          sales_return_id: string | null
          status: string | null
        }
        Insert: {
          amount: number
          amount_applied?: number | null
          applied_to_invoice_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_date: string
          credit_note_number: string
          currency?: string | null
          customer_id: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          reason?: string | null
          sales_return_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          amount_applied?: number | null
          applied_to_invoice_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_date?: string
          credit_note_number?: string
          currency?: string | null
          customer_id?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          reason?: string | null
          sales_return_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_applied_to_invoice_id_fkey"
            columns: ["applied_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_sales_return_id_fkey"
            columns: ["sales_return_id"]
            isOneToOne: false
            referencedRelation: "sales_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_advances: {
        Row: {
          advance_date: string
          advance_number: string
          created_at: string | null
          created_by: string | null
          customer_id: string
          id: string
          notes: string | null
          original_amount: number
          receipt_id: string | null
          remaining_amount: number
          status: string | null
        }
        Insert: {
          advance_date: string
          advance_number: string
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          original_amount: number
          receipt_id?: string | null
          remaining_amount: number
          status?: string | null
        }
        Update: {
          advance_date?: string
          advance_number?: string
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          original_amount?: number
          receipt_id?: string | null
          remaining_amount?: number
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_advances_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_advances_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "customer_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_invoice_lines: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          invoice_id: string
          line_number: number
          line_total: number
          product_id: string | null
          quantity: number
          so_line_id: string | null
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id: string
          line_number: number
          line_total: number
          product_id?: string | null
          quantity: number
          so_line_id?: string | null
          tax_rate?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string
          line_number?: number
          line_total?: number
          product_id?: string | null
          quantity?: number
          so_line_id?: string | null
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_invoice_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_invoice_lines_so_line_id_fkey"
            columns: ["so_line_id"]
            isOneToOne: false
            referencedRelation: "sales_order_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_invoices: {
        Row: {
          amount_paid: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          customer_id: string
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          payment_terms: number | null
          sales_order_id: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          amount_paid?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id: string
          due_date: string
          id?: string
          invoice_date: string
          invoice_number: string
          notes?: string | null
          payment_terms?: number | null
          sales_order_id?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          amount_paid?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          customer_id?: string
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          payment_terms?: number | null
          sales_order_id?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_invoices_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_po_lines: {
        Row: {
          cpo_id: string
          created_at: string
          customer_sku: string | null
          description: string | null
          id: string
          line_number: number
          notes: string | null
          product_id: string | null
          quantity: number
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          cpo_id: string
          created_at?: string
          customer_sku?: string | null
          description?: string | null
          id?: string
          line_number?: number
          notes?: string | null
          product_id?: string | null
          quantity?: number
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          cpo_id?: string
          created_at?: string
          customer_sku?: string | null
          description?: string | null
          id?: string
          line_number?: number
          notes?: string | null
          product_id?: string | null
          quantity?: number
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_po_lines_cpo_id_fkey"
            columns: ["cpo_id"]
            isOneToOne: false
            referencedRelation: "customer_pos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_po_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_pos: {
        Row: {
          converted_at: string | null
          cpo_number: string
          created_at: string
          currency: string | null
          customer_id: string
          id: string
          internal_ref: string
          notes: string | null
          order_date: string
          received_at: string | null
          received_by: string | null
          required_date: string | null
          shipping_address: string | null
          status: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          converted_at?: string | null
          cpo_number: string
          created_at?: string
          currency?: string | null
          customer_id: string
          id?: string
          internal_ref: string
          notes?: string | null
          order_date?: string
          received_at?: string | null
          received_by?: string | null
          required_date?: string | null
          shipping_address?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          converted_at?: string | null
          cpo_number?: string
          created_at?: string
          currency?: string | null
          customer_id?: string
          id?: string
          internal_ref?: string
          notes?: string | null
          order_date?: string
          received_at?: string | null
          received_by?: string | null
          required_date?: string | null
          shipping_address?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_pos_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_pos_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_receipts: {
        Row: {
          amount: number
          bank_account: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          id: string
          notes: string | null
          payment_method: string | null
          receipt_date: string
          receipt_number: string
          reference_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          bank_account?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_date: string
          receipt_number: string
          reference_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          bank_account?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          receipt_date?: string
          receipt_number?: string
          reference_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_receipts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          billing_address: string | null
          company_name: string
          contact_person: string | null
          created_at: string
          credit_limit: number | null
          customer_code: string
          email: string | null
          id: string
          notes: string | null
          payment_terms: number | null
          phone: string | null
          shipping_address: string | null
          status: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          credit_limit?: number | null
          customer_code: string
          email?: string | null
          id?: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          shipping_address?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          credit_limit?: number | null
          customer_code?: string
          email?: string | null
          id?: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          shipping_address?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      debit_note_applications: {
        Row: {
          amount: number
          applied_at: string | null
          applied_by: string | null
          debit_note_id: string
          id: string
          invoice_id: string
        }
        Insert: {
          amount: number
          applied_at?: string | null
          applied_by?: string | null
          debit_note_id: string
          id?: string
          invoice_id: string
        }
        Update: {
          amount?: number
          applied_at?: string | null
          applied_by?: string | null
          debit_note_id?: string
          id?: string
          invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debit_note_applications_debit_note_id_fkey"
            columns: ["debit_note_id"]
            isOneToOne: false
            referencedRelation: "debit_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debit_note_applications_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      debit_notes: {
        Row: {
          amount: number
          amount_applied: number | null
          applied_to_invoice_id: string | null
          created_at: string | null
          created_by: string | null
          debit_date: string
          debit_note_number: string
          grn_id: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          reason: string | null
          status: string | null
          supplier_id: string
        }
        Insert: {
          amount: number
          amount_applied?: number | null
          applied_to_invoice_id?: string | null
          created_at?: string | null
          created_by?: string | null
          debit_date: string
          debit_note_number: string
          grn_id?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          reason?: string | null
          status?: string | null
          supplier_id: string
        }
        Update: {
          amount?: number
          amount_applied?: number | null
          applied_to_invoice_id?: string | null
          created_at?: string | null
          created_by?: string | null
          debit_date?: string
          debit_note_number?: string
          grn_id?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          reason?: string | null
          status?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debit_notes_applied_to_invoice_id_fkey"
            columns: ["applied_to_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debit_notes_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "inbound_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debit_notes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      fund_transfers: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          converted_amount: number | null
          created_at: string | null
          created_by: string | null
          exchange_rate: number | null
          from_account_id: string
          id: string
          purpose: string | null
          status: string | null
          to_account_id: string
          transfer_date: string
          transfer_number: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          converted_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          exchange_rate?: number | null
          from_account_id: string
          id?: string
          purpose?: string | null
          status?: string | null
          to_account_id: string
          transfer_date: string
          transfer_number: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          converted_amount?: number | null
          created_at?: string | null
          created_by?: string | null
          exchange_rate?: number | null
          from_account_id?: string
          id?: string
          purpose?: string | null
          status?: string | null
          to_account_id?: string
          transfer_date?: string
          transfer_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "fund_transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      general_ledger: {
        Row: {
          account_code: string
          account_name: string
          cost_center_id: string | null
          created_at: string | null
          created_by: string | null
          credit: number | null
          debit: number | null
          description: string | null
          entry_date: string
          id: string
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          account_code: string
          account_name: string
          cost_center_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          entry_date: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          account_code?: string
          account_name?: string
          cost_center_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit?: number | null
          debit?: number | null
          description?: string | null
          entry_date?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "general_ledger_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      grn_lines: {
        Row: {
          batch_id: string | null
          bin_id: string | null
          created_at: string
          grn_id: string
          id: string
          notes: string | null
          po_line_id: string
          product_id: string
          quantity_received: number
        }
        Insert: {
          batch_id?: string | null
          bin_id?: string | null
          created_at?: string
          grn_id: string
          id?: string
          notes?: string | null
          po_line_id: string
          product_id: string
          quantity_received?: number
        }
        Update: {
          batch_id?: string | null
          bin_id?: string | null
          created_at?: string
          grn_id?: string
          id?: string
          notes?: string | null
          po_line_id?: string
          product_id?: string
          quantity_received?: number
        }
        Relationships: [
          {
            foreignKeyName: "grn_lines_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_lines_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "storage_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_lines_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "inbound_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_lines_po_line_id_fkey"
            columns: ["po_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_deliveries: {
        Row: {
          actual_date: string | null
          carrier: string | null
          created_at: string | null
          delivery_number: string
          discrepancy_notes: string | null
          dock_door: string | null
          expected_date: string | null
          id: string
          notes: string | null
          po_id: string | null
          quality_check_passed: boolean | null
          received_by: string | null
          received_items: number | null
          status: Database["public"]["Enums"]["delivery_status"] | null
          supplier_id: string | null
          total_items: number | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          actual_date?: string | null
          carrier?: string | null
          created_at?: string | null
          delivery_number: string
          discrepancy_notes?: string | null
          dock_door?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          po_id?: string | null
          quality_check_passed?: boolean | null
          received_by?: string | null
          received_items?: number | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
          supplier_id?: string | null
          total_items?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_date?: string | null
          carrier?: string | null
          created_at?: string | null
          delivery_number?: string
          discrepancy_notes?: string | null
          dock_door?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          po_id?: string | null
          quality_check_passed?: boolean | null
          received_by?: string | null
          received_items?: number | null
          status?: Database["public"]["Enums"]["delivery_status"] | null
          supplier_id?: string | null
          total_items?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inbound_deliveries_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbound_deliveries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          available_quantity: number | null
          bin_id: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          last_counted_at: string | null
          lot_number: string | null
          product_id: string
          quantity: number | null
          reserved_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          available_quantity?: number | null
          bin_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          last_counted_at?: string | null
          lot_number?: string | null
          product_id: string
          quantity?: number | null
          reserved_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          available_quantity?: number | null
          bin_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          last_counted_at?: string | null
          lot_number?: string | null
          product_id?: string
          quantity?: number | null
          reserved_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "storage_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_batches: {
        Row: {
          batch_number: string
          bin_id: string | null
          created_at: string
          current_quantity: number
          expiry_date: string | null
          id: string
          initial_quantity: number
          manufacturing_date: string | null
          notes: string | null
          po_id: string | null
          po_line_id: string | null
          product_id: string
          quality_status: string | null
          received_by: string | null
          received_date: string
          status: string
          supplier_batch_ref: string | null
          updated_at: string
        }
        Insert: {
          batch_number: string
          bin_id?: string | null
          created_at?: string
          current_quantity?: number
          expiry_date?: string | null
          id?: string
          initial_quantity?: number
          manufacturing_date?: string | null
          notes?: string | null
          po_id?: string | null
          po_line_id?: string | null
          product_id: string
          quality_status?: string | null
          received_by?: string | null
          received_date?: string
          status?: string
          supplier_batch_ref?: string | null
          updated_at?: string
        }
        Update: {
          batch_number?: string
          bin_id?: string | null
          created_at?: string
          current_quantity?: number
          expiry_date?: string | null
          id?: string
          initial_quantity?: number
          manufacturing_date?: string | null
          notes?: string | null
          po_id?: string | null
          po_line_id?: string | null
          product_id?: string
          quality_status?: string | null
          received_by?: string | null
          received_date?: string
          status?: string
          supplier_batch_ref?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "storage_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_po_line_id_fkey"
            columns: ["po_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          batch_id: string | null
          bin_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          product_id: string | null
          quantity: number
          reference_id: string | null
          reference_type: string | null
          transaction_date: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Insert: {
          batch_id?: string | null
          bin_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
        }
        Update: {
          batch_id?: string | null
          bin_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "storage_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          amount_paid: number | null
          approved_by: string | null
          approved_date: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          due_date: string
          goods_receipt_id: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          payment_date: string | null
          payment_reference: string | null
          po_id: string | null
          scheduled_payment_amount: number | null
          scheduled_payment_date: string | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          amount_paid?: number | null
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          due_date: string
          goods_receipt_id?: string | null
          id?: string
          invoice_date: string
          invoice_number: string
          notes?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          po_id?: string | null
          scheduled_payment_amount?: number | null
          scheduled_payment_date?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_paid?: number | null
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          due_date?: string
          goods_receipt_id?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          payment_date?: string | null
          payment_reference?: string | null
          po_id?: string | null
          scheduled_payment_amount?: number | null
          scheduled_payment_date?: string | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_goods_receipt_id_fkey"
            columns: ["goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "inbound_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      material_demands: {
        Row: {
          created_at: string | null
          created_by: string | null
          demand_type: Database["public"]["Enums"]["demand_type"]
          fulfilled_quantity: number | null
          id: string
          notes: string | null
          priority: string | null
          product_id: string
          quantity: number
          required_date: string
          source_id: string | null
          source_type: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          demand_type: Database["public"]["Enums"]["demand_type"]
          fulfilled_quantity?: number | null
          id?: string
          notes?: string | null
          priority?: string | null
          product_id: string
          quantity?: number
          required_date: string
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          demand_type?: Database["public"]["Enums"]["demand_type"]
          fulfilled_quantity?: number | null
          id?: string
          notes?: string | null
          priority?: string | null
          product_id?: string
          quantity?: number
          required_date?: string
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_demands_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_demands_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string | null
          read: boolean | null
          request_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          request_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          request_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
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
      outbound_shipments: {
        Row: {
          carrier: string | null
          created_at: string | null
          customer_address: string | null
          customer_name: string | null
          id: string
          notes: string | null
          packed_by: string | null
          picked_by: string | null
          priority: string | null
          sales_order_id: string | null
          ship_date: string | null
          shipment_number: string
          shipped_by: string | null
          shipped_items: number | null
          shipping_cost: number | null
          status: Database["public"]["Enums"]["shipment_status"] | null
          total_items: number | null
          tracking_number: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_name?: string | null
          id?: string
          notes?: string | null
          packed_by?: string | null
          picked_by?: string | null
          priority?: string | null
          sales_order_id?: string | null
          ship_date?: string | null
          shipment_number: string
          shipped_by?: string | null
          shipped_items?: number | null
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          total_items?: number | null
          tracking_number?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          carrier?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_name?: string | null
          id?: string
          notes?: string | null
          packed_by?: string | null
          picked_by?: string | null
          priority?: string | null
          sales_order_id?: string | null
          ship_date?: string | null
          shipment_number?: string
          shipped_by?: string | null
          shipped_items?: number | null
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          total_items?: number | null
          tracking_number?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      payment_allocations: {
        Row: {
          allocated_at: string | null
          amount: number
          id: string
          invoice_id: string
          payment_id: string
        }
        Insert: {
          allocated_at?: string | null
          amount: number
          id?: string
          invoice_id: string
          payment_id: string
        }
        Update: {
          allocated_at?: string | null
          amount?: number
          id?: string
          invoice_id?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "vendor_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_batch_items: {
        Row: {
          amount: number
          batch_id: string
          id: string
          payee_name: string
          payment_method: string | null
          reference: string | null
          status: string | null
          vendor_payment_id: string | null
        }
        Insert: {
          amount: number
          batch_id: string
          id?: string
          payee_name: string
          payment_method?: string | null
          reference?: string | null
          status?: string | null
          vendor_payment_id?: string | null
        }
        Update: {
          amount?: number
          batch_id?: string
          id?: string
          payee_name?: string
          payment_method?: string | null
          reference?: string | null
          status?: string | null
          vendor_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "payment_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_batch_items_vendor_payment_id_fkey"
            columns: ["vendor_payment_id"]
            isOneToOne: false
            referencedRelation: "vendor_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_batches: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bank_account_id: string
          batch_date: string
          batch_number: string
          batch_type: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          payment_count: number | null
          processed_at: string | null
          status: string | null
          total_amount: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id: string
          batch_date: string
          batch_number: string
          batch_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_count?: number | null
          processed_at?: string | null
          status?: string | null
          total_amount: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id?: string
          batch_date?: string
          batch_number?: string
          batch_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_count?: number | null
          processed_at?: string | null
          status?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_batches_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      po_amendments: {
        Row: {
          amendment_reason: string
          changed_fields: string[] | null
          created_at: string | null
          id: string
          new_values: Json | null
          notes: string | null
          old_values: Json | null
          po_id: string
          requested_by: string | null
          requested_date: string | null
          reviewed_by: string | null
          reviewed_date: string | null
          status: Database["public"]["Enums"]["amendment_status"] | null
          version: number
        }
        Insert: {
          amendment_reason: string
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          po_id: string
          requested_by?: string | null
          requested_date?: string | null
          reviewed_by?: string | null
          reviewed_date?: string | null
          status?: Database["public"]["Enums"]["amendment_status"] | null
          version?: number
        }
        Update: {
          amendment_reason?: string
          changed_fields?: string[] | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          po_id?: string
          requested_by?: string | null
          requested_date?: string | null
          reviewed_by?: string | null
          reviewed_date?: string | null
          status?: Database["public"]["Enums"]["amendment_status"] | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "po_amendments_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_amendments_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_amendments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      po_approval_amendments: {
        Row: {
          amended_by: string | null
          amendment_type: string
          approval_request_id: string | null
          approval_step_id: string | null
          created_at: string | null
          field_name: string | null
          id: string
          line_id: string | null
          new_value: Json | null
          old_value: Json | null
          po_id: string
          reason: string
        }
        Insert: {
          amended_by?: string | null
          amendment_type: string
          approval_request_id?: string | null
          approval_step_id?: string | null
          created_at?: string | null
          field_name?: string | null
          id?: string
          line_id?: string | null
          new_value?: Json | null
          old_value?: Json | null
          po_id: string
          reason: string
        }
        Update: {
          amended_by?: string | null
          amendment_type?: string
          approval_request_id?: string | null
          approval_step_id?: string | null
          created_at?: string | null
          field_name?: string | null
          id?: string
          line_id?: string | null
          new_value?: Json | null
          old_value?: Json | null
          po_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_approval_amendments_amended_by_fkey"
            columns: ["amended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_approval_amendments_approval_request_id_fkey"
            columns: ["approval_request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_approval_amendments_approval_step_id_fkey"
            columns: ["approval_step_id"]
            isOneToOne: false
            referencedRelation: "approval_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_approval_amendments_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_approval_amendments_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sale_items: {
        Row: {
          batches_used: Json | null
          cost_at_sale: number | null
          created_at: string | null
          discount: number | null
          id: string
          line_total: number
          pos_sale_id: string
          product_id: string | null
          quantity: number
          sku: string
          tax_rate: number
          unit_price: number
        }
        Insert: {
          batches_used?: Json | null
          cost_at_sale?: number | null
          created_at?: string | null
          discount?: number | null
          id?: string
          line_total: number
          pos_sale_id: string
          product_id?: string | null
          quantity: number
          sku: string
          tax_rate: number
          unit_price: number
        }
        Update: {
          batches_used?: Json | null
          cost_at_sale?: number | null
          created_at?: string | null
          discount?: number | null
          id?: string
          line_total?: number
          pos_sale_id?: string
          product_id?: string | null
          quantity?: number
          sku?: string
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "pos_sale_items_pos_sale_id_fkey"
            columns: ["pos_sale_id"]
            isOneToOne: false
            referencedRelation: "pos_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_sales: {
        Row: {
          amount_paid: number
          bank_account_id: string | null
          change_given: number | null
          created_at: string | null
          customer_id: string | null
          error_message: string | null
          id: string
          invoice_id: string | null
          payment_method: string | null
          pos_terminal_id: string
          pos_transaction_id: string
          raw_payload: Json | null
          receipt_id: string | null
          status: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          transaction_datetime: string
        }
        Insert: {
          amount_paid: number
          bank_account_id?: string | null
          change_given?: number | null
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          payment_method?: string | null
          pos_terminal_id: string
          pos_transaction_id: string
          raw_payload?: Json | null
          receipt_id?: string | null
          status?: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          transaction_datetime: string
        }
        Update: {
          amount_paid?: number
          bank_account_id?: string | null
          change_given?: number | null
          created_at?: string | null
          customer_id?: string | null
          error_message?: string | null
          id?: string
          invoice_id?: string | null
          payment_method?: string | null
          pos_terminal_id?: string
          pos_transaction_id?: string
          raw_payload?: Json | null
          receipt_id?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          transaction_datetime?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_sales_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_sales_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "customer_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list_items: {
        Row: {
          created_at: string | null
          id: string
          lead_time_days: number | null
          max_quantity: number | null
          min_quantity: number | null
          notes: string | null
          price_list_id: string
          product_id: string | null
          product_name: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_time_days?: number | null
          max_quantity?: number | null
          min_quantity?: number | null
          notes?: string | null
          price_list_id: string
          product_id?: string | null
          product_name?: string | null
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_time_days?: number | null
          max_quantity?: number | null
          min_quantity?: number | null
          notes?: string | null
          price_list_id?: string
          product_id?: string | null
          product_name?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_list_items_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          supplier_id: string
          updated_at: string | null
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          supplier_id: string
          updated_at?: string | null
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          supplier_id?: string
          updated_at?: string | null
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_lists_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          batch_tracked: boolean | null
          category: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          height: number | null
          id: string
          is_active: boolean | null
          lead_time_days: number | null
          length: number | null
          max_stock_level: number | null
          min_stock_level: number | null
          name: string
          reorder_point: number | null
          serial_tracked: boolean | null
          sku: string
          unit_cost: number | null
          unit_of_measure: string | null
          updated_at: string | null
          weight: number | null
          width: number | null
        }
        Insert: {
          batch_tracked?: boolean | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          lead_time_days?: number | null
          length?: number | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          name: string
          reorder_point?: number | null
          serial_tracked?: boolean | null
          sku: string
          unit_cost?: number | null
          unit_of_measure?: string | null
          updated_at?: string | null
          weight?: number | null
          width?: number | null
        }
        Update: {
          batch_tracked?: boolean | null
          category?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          height?: number | null
          id?: string
          is_active?: boolean | null
          lead_time_days?: number | null
          length?: number | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          name?: string
          reorder_point?: number | null
          serial_tracked?: boolean | null
          sku?: string
          unit_cost?: number | null
          unit_of_measure?: string | null
          updated_at?: string | null
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string | null
          employee_id: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          manager_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          employee_id?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_lines: {
        Row: {
          blanket_line_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          po_id: string
          pr_line_id: string | null
          product_id: string | null
          quantity: number
          received_quantity: number | null
          total_price: number | null
          unit_price: number
        }
        Insert: {
          blanket_line_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          po_id: string
          pr_line_id?: string | null
          product_id?: string | null
          quantity: number
          received_quantity?: number | null
          total_price?: number | null
          unit_price: number
        }
        Update: {
          blanket_line_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          po_id?: string
          pr_line_id?: string | null
          product_id?: string | null
          quantity?: number
          received_quantity?: number | null
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_blanket_line_id_fkey"
            columns: ["blanket_line_id"]
            isOneToOne: false
            referencedRelation: "blanket_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_pr_line_id_fkey"
            columns: ["pr_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisition_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          amendment_version: number | null
          approved_by: string | null
          approved_date: string | null
          blanket_order_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          expected_delivery: string | null
          id: string
          is_locked: boolean | null
          locked_at: string | null
          locked_by: string | null
          notes: string | null
          order_date: string | null
          po_number: string
          pr_id: string | null
          rfq_response_id: string | null
          status: string | null
          supplier_id: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          amendment_version?: number | null
          approved_by?: string | null
          approved_date?: string | null
          blanket_order_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          expected_delivery?: string | null
          id?: string
          is_locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          order_date?: string | null
          po_number: string
          pr_id?: string | null
          rfq_response_id?: string | null
          status?: string | null
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          amendment_version?: number | null
          approved_by?: string | null
          approved_date?: string | null
          blanket_order_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          expected_delivery?: string | null
          id?: string
          is_locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          order_date?: string | null
          po_number?: string
          pr_id?: string | null
          rfq_response_id?: string | null
          status?: string | null
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_blanket_order_id_fkey"
            columns: ["blanket_order_id"]
            isOneToOne: false
            referencedRelation: "blanket_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_rfq_response_id_fkey"
            columns: ["rfq_response_id"]
            isOneToOne: false
            referencedRelation: "rfq_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requisition_lines: {
        Row: {
          created_at: string | null
          delivery_date_required: string | null
          estimated_price: number | null
          id: string
          notes: string | null
          pr_id: string
          product_id: string | null
          product_name: string | null
          quantity: number
          specifications: string | null
          suggested_supplier_id: string | null
          total_price: number | null
          unit_of_measure: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_date_required?: string | null
          estimated_price?: number | null
          id?: string
          notes?: string | null
          pr_id: string
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          specifications?: string | null
          suggested_supplier_id?: string | null
          total_price?: number | null
          unit_of_measure?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_date_required?: string | null
          estimated_price?: number | null
          id?: string
          notes?: string | null
          pr_id?: string
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          specifications?: string | null
          suggested_supplier_id?: string | null
          total_price?: number | null
          unit_of_measure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requisition_lines_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requisition_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requisition_lines_suggested_supplier_id_fkey"
            columns: ["suggested_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requisitions: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          cost_center_id: string | null
          created_at: string | null
          currency: string | null
          department: string | null
          id: string
          justification: string | null
          notes: string | null
          pr_number: string
          requestor_id: string | null
          required_date: string | null
          status: Database["public"]["Enums"]["pr_status"] | null
          total_estimated_value: number | null
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          currency?: string | null
          department?: string | null
          id?: string
          justification?: string | null
          notes?: string | null
          pr_number: string
          requestor_id?: string | null
          required_date?: string | null
          status?: Database["public"]["Enums"]["pr_status"] | null
          total_estimated_value?: number | null
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          currency?: string | null
          department?: string | null
          id?: string
          justification?: string | null
          notes?: string | null
          pr_number?: string
          requestor_id?: string | null
          required_date?: string | null
          status?: Database["public"]["Enums"]["pr_status"] | null
          total_estimated_value?: number | null
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requisitions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requisitions_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requisitions_requestor_id_fkey"
            columns: ["requestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_return_lines: {
        Row: {
          batch_id: string | null
          bin_id: string | null
          created_at: string
          grn_line_id: string | null
          id: string
          line_total: number | null
          po_line_id: string | null
          product_id: string
          quantity_returned: number
          reason_notes: string | null
          return_id: string
          unit_cost: number | null
        }
        Insert: {
          batch_id?: string | null
          bin_id?: string | null
          created_at?: string
          grn_line_id?: string | null
          id?: string
          line_total?: number | null
          po_line_id?: string | null
          product_id: string
          quantity_returned?: number
          reason_notes?: string | null
          return_id: string
          unit_cost?: number | null
        }
        Update: {
          batch_id?: string | null
          bin_id?: string | null
          created_at?: string
          grn_line_id?: string | null
          id?: string
          line_total?: number | null
          po_line_id?: string | null
          product_id?: string
          quantity_returned?: number
          reason_notes?: string | null
          return_id?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_return_lines_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_lines_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "storage_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_lines_grn_line_id_fkey"
            columns: ["grn_line_id"]
            isOneToOne: false
            referencedRelation: "grn_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_lines_po_line_id_fkey"
            columns: ["po_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_lines_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "purchase_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_returns: {
        Row: {
          created_at: string
          created_by: string | null
          credit_date: string | null
          credit_note_number: string | null
          grn_id: string | null
          id: string
          notes: string | null
          purchase_order_id: string | null
          received_date: string | null
          return_date: string
          return_number: string
          return_reason: Database["public"]["Enums"]["return_reason"]
          shipped_date: string | null
          status: Database["public"]["Enums"]["purchase_return_status"]
          supplier_id: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          credit_date?: string | null
          credit_note_number?: string | null
          grn_id?: string | null
          id?: string
          notes?: string | null
          purchase_order_id?: string | null
          received_date?: string | null
          return_date?: string
          return_number: string
          return_reason?: Database["public"]["Enums"]["return_reason"]
          shipped_date?: string | null
          status?: Database["public"]["Enums"]["purchase_return_status"]
          supplier_id: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credit_date?: string | null
          credit_note_number?: string | null
          grn_id?: string | null
          id?: string
          notes?: string | null
          purchase_order_id?: string | null
          received_date?: string | null
          return_date?: string
          return_number?: string
          return_reason?: Database["public"]["Enums"]["return_reason"]
          shipped_date?: string | null
          status?: Database["public"]["Enums"]["purchase_return_status"]
          supplier_id?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_returns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_returns_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "inbound_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_returns_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_returns_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      putaway_tasks: {
        Row: {
          assigned_bin_id: string | null
          assigned_to: string | null
          batch_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          grn_id: string | null
          grn_line_id: string | null
          id: string
          notes: string | null
          priority: string | null
          product_id: string
          quantity: number
          source_location: string | null
          started_at: string | null
          status: string
          suggested_bin_id: string | null
          task_number: string
          updated_at: string
        }
        Insert: {
          assigned_bin_id?: string | null
          assigned_to?: string | null
          batch_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          grn_id?: string | null
          grn_line_id?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          product_id: string
          quantity?: number
          source_location?: string | null
          started_at?: string | null
          status?: string
          suggested_bin_id?: string | null
          task_number: string
          updated_at?: string
        }
        Update: {
          assigned_bin_id?: string | null
          assigned_to?: string | null
          batch_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          grn_id?: string | null
          grn_line_id?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          product_id?: string
          quantity?: number
          source_location?: string | null
          started_at?: string | null
          status?: string
          suggested_bin_id?: string | null
          task_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "putaway_tasks_assigned_bin_id_fkey"
            columns: ["assigned_bin_id"]
            isOneToOne: false
            referencedRelation: "storage_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_tasks_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_tasks_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "inbound_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_tasks_grn_line_id_fkey"
            columns: ["grn_line_id"]
            isOneToOne: false
            referencedRelation: "grn_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_tasks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "putaway_tasks_suggested_bin_id_fkey"
            columns: ["suggested_bin_id"]
            isOneToOne: false
            referencedRelation: "storage_bins"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_allocations: {
        Row: {
          allocated_at: string | null
          amount: number
          id: string
          invoice_id: string
          receipt_id: string
        }
        Insert: {
          allocated_at?: string | null
          amount: number
          id?: string
          invoice_id: string
          receipt_id: string
        }
        Update: {
          allocated_at?: string | null
          amount?: number
          id?: string
          invoice_id?: string
          receipt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_allocations_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "customer_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_items: {
        Row: {
          amount: number
          description: string | null
          id: string
          is_cleared: boolean | null
          item_type: string | null
          reconciliation_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          description?: string | null
          id?: string
          is_cleared?: boolean | null
          item_type?: string | null
          reconciliation_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          description?: string | null
          id?: string
          is_cleared?: boolean | null
          item_type?: string | null
          reconciliation_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_items_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "bank_reconciliations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_invited_suppliers: {
        Row: {
          id: string
          invited_date: string | null
          responded: boolean | null
          rfq_id: string
          supplier_id: string
        }
        Insert: {
          id?: string
          invited_date?: string | null
          responded?: boolean | null
          rfq_id: string
          supplier_id: string
        }
        Update: {
          id?: string
          invited_date?: string | null
          responded?: boolean | null
          rfq_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_invited_suppliers_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfq_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_invited_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_lines: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          pr_line_id: string | null
          product_id: string | null
          product_name: string | null
          quantity: number
          rfq_id: string
          specifications: string | null
          target_price: number | null
          unit_of_measure: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          pr_line_id?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          rfq_id: string
          specifications?: string | null
          target_price?: number | null
          unit_of_measure?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          pr_line_id?: string | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          rfq_id?: string
          specifications?: string | null
          target_price?: number | null
          unit_of_measure?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfq_lines_pr_line_id_fkey"
            columns: ["pr_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisition_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_lines_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfq_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_requests: {
        Row: {
          awarded_date: string | null
          awarded_to: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          evaluation_criteria: Json | null
          id: string
          notes: string | null
          pr_id: string | null
          publish_date: string | null
          response_deadline: string | null
          rfq_number: string
          rfq_type: string | null
          status: Database["public"]["Enums"]["rfq_status"] | null
          terms_conditions: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          awarded_date?: string | null
          awarded_to?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          evaluation_criteria?: Json | null
          id?: string
          notes?: string | null
          pr_id?: string | null
          publish_date?: string | null
          response_deadline?: string | null
          rfq_number: string
          rfq_type?: string | null
          status?: Database["public"]["Enums"]["rfq_status"] | null
          terms_conditions?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          awarded_date?: string | null
          awarded_to?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          evaluation_criteria?: Json | null
          id?: string
          notes?: string | null
          pr_id?: string | null
          publish_date?: string | null
          response_deadline?: string | null
          rfq_number?: string
          rfq_type?: string | null
          status?: Database["public"]["Enums"]["rfq_status"] | null
          terms_conditions?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfq_requests_awarded_to_fkey"
            columns: ["awarded_to"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_requests_pr_id_fkey"
            columns: ["pr_id"]
            isOneToOne: false
            referencedRelation: "purchase_requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_response_lines: {
        Row: {
          created_at: string | null
          id: string
          lead_time_days: number | null
          notes: string | null
          response_id: string
          rfq_line_id: string
          total_price: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_time_days?: number | null
          notes?: string | null
          response_id: string
          rfq_line_id: string
          total_price?: number | null
          unit_price?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_time_days?: number | null
          notes?: string | null
          response_id?: string
          rfq_line_id?: string
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "rfq_response_lines_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "rfq_responses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_response_lines_rfq_line_id_fkey"
            columns: ["rfq_line_id"]
            isOneToOne: false
            referencedRelation: "rfq_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_responses: {
        Row: {
          commercial_score: number | null
          created_at: string | null
          delivery_days: number | null
          id: string
          notes: string | null
          overall_score: number | null
          payment_terms: string | null
          rfq_id: string
          status: Database["public"]["Enums"]["rfq_response_status"] | null
          submitted_date: string | null
          supplier_id: string
          technical_score: number | null
          total_bid_amount: number | null
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          commercial_score?: number | null
          created_at?: string | null
          delivery_days?: number | null
          id?: string
          notes?: string | null
          overall_score?: number | null
          payment_terms?: string | null
          rfq_id: string
          status?: Database["public"]["Enums"]["rfq_response_status"] | null
          submitted_date?: string | null
          supplier_id: string
          technical_score?: number | null
          total_bid_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          commercial_score?: number | null
          created_at?: string | null
          delivery_days?: number | null
          id?: string
          notes?: string | null
          overall_score?: number | null
          payment_terms?: string | null
          rfq_id?: string
          status?: Database["public"]["Enums"]["rfq_response_status"] | null
          submitted_date?: string | null
          supplier_id?: string
          technical_score?: number | null
          total_bid_amount?: number | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rfq_responses_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfq_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_responses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_flags: {
        Row: {
          created_at: string | null
          evidence_urls: string[] | null
          flag_type: Database["public"]["Enums"]["risk_flag_type"]
          flagged_by: string | null
          flagged_date: string | null
          id: string
          is_active: boolean | null
          reason: string
          resolution_date: string | null
          resolution_notes: string | null
          supplier_id: string
        }
        Insert: {
          created_at?: string | null
          evidence_urls?: string[] | null
          flag_type: Database["public"]["Enums"]["risk_flag_type"]
          flagged_by?: string | null
          flagged_date?: string | null
          id?: string
          is_active?: boolean | null
          reason: string
          resolution_date?: string | null
          resolution_notes?: string | null
          supplier_id: string
        }
        Update: {
          created_at?: string | null
          evidence_urls?: string[] | null
          flag_type?: Database["public"]["Enums"]["risk_flag_type"]
          flagged_by?: string | null
          flagged_date?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string
          resolution_date?: string | null
          resolution_notes?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_flags_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      role_descriptions: {
        Row: {
          description: string | null
          module_access: string[] | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          module_access?: string[] | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          module_access?: string[] | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_descriptions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_lines: {
        Row: {
          bin_id: string | null
          cpo_line_id: string | null
          created_at: string
          id: string
          line_number: number
          product_id: string
          quantity_ordered: number
          quantity_picked: number | null
          quantity_reserved: number | null
          quantity_shipped: number | null
          so_id: string
          status: string | null
          total_price: number | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          bin_id?: string | null
          cpo_line_id?: string | null
          created_at?: string
          id?: string
          line_number?: number
          product_id: string
          quantity_ordered?: number
          quantity_picked?: number | null
          quantity_reserved?: number | null
          quantity_shipped?: number | null
          so_id: string
          status?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          bin_id?: string | null
          cpo_line_id?: string | null
          created_at?: string
          id?: string
          line_number?: number
          product_id?: string
          quantity_ordered?: number
          quantity_picked?: number | null
          quantity_reserved?: number | null
          quantity_shipped?: number | null
          so_id?: string
          status?: string | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_lines_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "storage_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_lines_cpo_line_id_fkey"
            columns: ["cpo_line_id"]
            isOneToOne: false
            referencedRelation: "customer_po_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_lines_so_id_fkey"
            columns: ["so_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          assigned_to: string | null
          billing_address: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          customer_po_id: string | null
          id: string
          notes: string | null
          order_date: string
          payment_terms: number | null
          priority: string | null
          required_date: string | null
          ship_date: string | null
          shipping_address: string | null
          shipping_cost: number | null
          so_number: string
          status: string
          tax_amount: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          billing_address?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          customer_po_id?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          payment_terms?: number | null
          priority?: string | null
          required_date?: string | null
          ship_date?: string | null
          shipping_address?: string | null
          shipping_cost?: number | null
          so_number: string
          status?: string
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          billing_address?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          customer_po_id?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          payment_terms?: number | null
          priority?: string | null
          required_date?: string | null
          ship_date?: string | null
          shipping_address?: string | null
          shipping_cost?: number | null
          so_number?: string
          status?: string
          tax_amount?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_po_id_fkey"
            columns: ["customer_po_id"]
            isOneToOne: false
            referencedRelation: "customer_pos"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_return_lines: {
        Row: {
          batch_id: string | null
          bin_id: string | null
          created_at: string
          disposition: string | null
          id: string
          inspection_notes: string | null
          line_number: number
          product_id: string
          quantity_received: number | null
          quantity_returned: number
          return_id: string
          so_line_id: string | null
          total_price: number | null
          unit_price: number
        }
        Insert: {
          batch_id?: string | null
          bin_id?: string | null
          created_at?: string
          disposition?: string | null
          id?: string
          inspection_notes?: string | null
          line_number?: number
          product_id: string
          quantity_received?: number | null
          quantity_returned?: number
          return_id: string
          so_line_id?: string | null
          total_price?: number | null
          unit_price?: number
        }
        Update: {
          batch_id?: string | null
          bin_id?: string | null
          created_at?: string
          disposition?: string | null
          id?: string
          inspection_notes?: string | null
          line_number?: number
          product_id?: string
          quantity_received?: number | null
          quantity_returned?: number
          return_id?: string
          so_line_id?: string | null
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_return_lines_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_lines_bin_id_fkey"
            columns: ["bin_id"]
            isOneToOne: false
            referencedRelation: "storage_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_lines_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "sales_returns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_lines_so_line_id_fkey"
            columns: ["so_line_id"]
            isOneToOne: false
            referencedRelation: "sales_order_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_returns: {
        Row: {
          completed_date: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          notes: string | null
          reason_notes: string | null
          received_date: string | null
          return_date: string
          return_number: string
          return_reason: string
          sales_order_id: string | null
          status: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          notes?: string | null
          reason_notes?: string | null
          received_date?: string | null
          return_date?: string
          return_number: string
          return_reason: string
          sales_order_id?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          notes?: string | null
          reason_notes?: string | null
          received_date?: string | null
          return_date?: string
          return_number?: string
          return_reason?: string
          sales_order_id?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_payment_items: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string
          scheduled_payment_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_id: string
          scheduled_payment_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          scheduled_payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_payment_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_payment_items_scheduled_payment_id_fkey"
            columns: ["scheduled_payment_id"]
            isOneToOne: false
            referencedRelation: "scheduled_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_payments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bank_account_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          payment_method: string | null
          processed_at: string | null
          schedule_number: string
          scheduled_date: string
          status: string
          supplier_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          processed_at?: string | null
          schedule_number: string
          scheduled_date: string
          status?: string
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          processed_at?: string | null
          schedule_number?: string
          scheduled_date?: string
          status?: string
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sod_conflicts: {
        Row: {
          conflict_name: string
          created_at: string | null
          description: string | null
          id: string
          is_blocking: boolean | null
          risk_level: string
          role_a: Database["public"]["Enums"]["app_role"]
          role_b: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          conflict_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_blocking?: boolean | null
          risk_level: string
          role_a: Database["public"]["Enums"]["app_role"]
          role_b: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          conflict_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_blocking?: boolean | null
          risk_level?: string
          role_a?: Database["public"]["Enums"]["app_role"]
          role_b?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      step_approvers: {
        Row: {
          approver_type: string
          approver_value: string | null
          created_at: string | null
          id: string
          step_id: string
        }
        Insert: {
          approver_type: string
          approver_value?: string | null
          created_at?: string | null
          id?: string
          step_id: string
        }
        Update: {
          approver_type?: string
          approver_value?: string | null
          created_at?: string | null
          id?: string
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_approvers_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "approval_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          from_bin_id: string | null
          id: string
          notes: string | null
          priority: string | null
          product_id: string | null
          quantity: number
          reason: string | null
          status: Database["public"]["Enums"]["transfer_status"] | null
          to_bin_id: string | null
          transfer_date: string | null
          transfer_number: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          from_bin_id?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          product_id?: string | null
          quantity: number
          reason?: string | null
          status?: Database["public"]["Enums"]["transfer_status"] | null
          to_bin_id?: string | null
          transfer_date?: string | null
          transfer_number: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          from_bin_id?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          product_id?: string | null
          quantity?: number
          reason?: string | null
          status?: Database["public"]["Enums"]["transfer_status"] | null
          to_bin_id?: string | null
          transfer_date?: string | null
          transfer_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_from_bin_id_fkey"
            columns: ["from_bin_id"]
            isOneToOne: false
            referencedRelation: "storage_bins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_bin_id_fkey"
            columns: ["to_bin_id"]
            isOneToOne: false
            referencedRelation: "storage_bins"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_bins: {
        Row: {
          bin_code: string
          bin_type: string | null
          capacity: number | null
          column_number: string | null
          created_at: string | null
          current_quantity: number | null
          id: string
          is_active: boolean | null
          level_number: string | null
          row_number: string | null
          status: Database["public"]["Enums"]["bin_status"] | null
          zone_id: string | null
        }
        Insert: {
          bin_code: string
          bin_type?: string | null
          capacity?: number | null
          column_number?: string | null
          created_at?: string | null
          current_quantity?: number | null
          id?: string
          is_active?: boolean | null
          level_number?: string | null
          row_number?: string | null
          status?: Database["public"]["Enums"]["bin_status"] | null
          zone_id?: string | null
        }
        Update: {
          bin_code?: string
          bin_type?: string | null
          capacity?: number | null
          column_number?: string | null
          created_at?: string | null
          current_quantity?: number | null
          id?: string
          is_active?: boolean | null
          level_number?: string | null
          row_number?: string | null
          status?: Database["public"]["Enums"]["bin_status"] | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "storage_bins_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "storage_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_zones: {
        Row: {
          created_at: string | null
          current_utilization: number | null
          id: string
          is_active: boolean | null
          max_capacity: number | null
          max_temperature: number | null
          min_temperature: number | null
          name: string
          temperature_controlled: boolean | null
          warehouse_id: string | null
          zone_code: string
          zone_type: string | null
        }
        Insert: {
          created_at?: string | null
          current_utilization?: number | null
          id?: string
          is_active?: boolean | null
          max_capacity?: number | null
          max_temperature?: number | null
          min_temperature?: number | null
          name: string
          temperature_controlled?: boolean | null
          warehouse_id?: string | null
          zone_code: string
          zone_type?: string | null
        }
        Update: {
          created_at?: string | null
          current_utilization?: number | null
          id?: string
          is_active?: boolean | null
          max_capacity?: number | null
          max_temperature?: number | null
          min_temperature?: number | null
          name?: string
          temperature_controlled?: boolean | null
          warehouse_id?: string | null
          zone_code?: string
          zone_type?: string | null
        }
        Relationships: []
      }
      supplier_evaluations: {
        Row: {
          comments: string | null
          created_at: string | null
          delivery_score: number | null
          evaluation_date: string | null
          evaluation_period: string | null
          evaluator_id: string | null
          id: string
          overall_score: number | null
          price_score: number | null
          quality_score: number | null
          recommendations: string | null
          service_score: number | null
          strengths: string[] | null
          supplier_id: string
          weaknesses: string[] | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          delivery_score?: number | null
          evaluation_date?: string | null
          evaluation_period?: string | null
          evaluator_id?: string | null
          id?: string
          overall_score?: number | null
          price_score?: number | null
          quality_score?: number | null
          recommendations?: string | null
          service_score?: number | null
          strengths?: string[] | null
          supplier_id: string
          weaknesses?: string[] | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          delivery_score?: number | null
          evaluation_date?: string | null
          evaluation_period?: string | null
          evaluator_id?: string | null
          id?: string
          overall_score?: number | null
          price_score?: number | null
          quality_score?: number | null
          recommendations?: string | null
          service_score?: number | null
          strengths?: string[] | null
          supplier_id?: string
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_evaluations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_registrations: {
        Row: {
          business_license_verified: boolean | null
          compliance_verified: boolean | null
          created_at: string | null
          documents_url: string[] | null
          id: string
          insurance_verified: boolean | null
          notes: string | null
          rejection_reason: string | null
          reviewed_by: string | null
          reviewed_date: string | null
          status: Database["public"]["Enums"]["registration_status"] | null
          submitted_date: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          business_license_verified?: boolean | null
          compliance_verified?: boolean | null
          created_at?: string | null
          documents_url?: string[] | null
          id?: string
          insurance_verified?: boolean | null
          notes?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          reviewed_date?: string | null
          status?: Database["public"]["Enums"]["registration_status"] | null
          submitted_date?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          business_license_verified?: boolean | null
          compliance_verified?: boolean | null
          created_at?: string | null
          documents_url?: string[] | null
          id?: string
          insurance_verified?: boolean | null
          notes?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          reviewed_date?: string | null
          status?: Database["public"]["Enums"]["registration_status"] | null
          submitted_date?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_registrations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_scorecards: {
        Row: {
          compliance_score: number | null
          created_at: string | null
          defect_rate: number | null
          id: string
          notes: string | null
          on_time_delivery_rate: number | null
          period_end: string
          period_start: string
          ranking: number | null
          response_time_avg: number | null
          supplier_id: string
          total_orders: number | null
          total_value: number | null
          trend: Database["public"]["Enums"]["scorecard_trend"] | null
        }
        Insert: {
          compliance_score?: number | null
          created_at?: string | null
          defect_rate?: number | null
          id?: string
          notes?: string | null
          on_time_delivery_rate?: number | null
          period_end: string
          period_start: string
          ranking?: number | null
          response_time_avg?: number | null
          supplier_id: string
          total_orders?: number | null
          total_value?: number | null
          trend?: Database["public"]["Enums"]["scorecard_trend"] | null
        }
        Update: {
          compliance_score?: number | null
          created_at?: string | null
          defect_rate?: number | null
          id?: string
          notes?: string | null
          on_time_delivery_rate?: number | null
          period_end?: string
          period_start?: string
          ranking?: number | null
          response_time_avg?: number | null
          supplier_id?: string
          total_orders?: number | null
          total_value?: number | null
          trend?: Database["public"]["Enums"]["scorecard_trend"] | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_scorecards_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          company_name: string
          contact_person: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          industry: string | null
          notes: string | null
          payment_terms: number | null
          phone: string | null
          registration_date: string | null
          status: Database["public"]["Enums"]["supplier_status"] | null
          supplier_code: string
          tax_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          company_name: string
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          registration_date?: string | null
          status?: Database["public"]["Enums"]["supplier_status"] | null
          supplier_code: string
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          company_name?: string
          contact_person?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          registration_date?: string | null
          status?: Database["public"]["Enums"]["supplier_status"] | null
          supplier_code?: string
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      system_config: {
        Row: {
          category: string
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          category: string
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "system_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      vendor_advance_allocations: {
        Row: {
          advance_id: string
          allocated_at: string | null
          amount: number
          id: string
          invoice_id: string
        }
        Insert: {
          advance_id: string
          allocated_at?: string | null
          amount: number
          id?: string
          invoice_id: string
        }
        Update: {
          advance_id?: string
          allocated_at?: string | null
          amount?: number
          id?: string
          invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_advance_allocations_advance_id_fkey"
            columns: ["advance_id"]
            isOneToOne: false
            referencedRelation: "vendor_advances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_advance_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_advances: {
        Row: {
          advance_date: string
          advance_number: string
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          original_amount: number
          payment_id: string | null
          remaining_amount: number
          status: string | null
          supplier_id: string
        }
        Insert: {
          advance_date: string
          advance_number: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          original_amount: number
          payment_id?: string | null
          remaining_amount: number
          status?: string | null
          supplier_id: string
        }
        Update: {
          advance_date?: string
          advance_number?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          original_amount?: number
          payment_id?: string | null
          remaining_amount?: number
          status?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_advances_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "vendor_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_advances_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payments: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          bank_account: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          payment_number: string
          reference_number: string | null
          status: string | null
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          bank_account?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          payment_number: string
          reference_number?: string | null
          status?: string | null
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_account?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_number?: string
          reference_number?: string | null
          status?: string | null
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      wht_certificates: {
        Row: {
          certificate_date: string
          certificate_number: string
          created_at: string | null
          created_by: string | null
          filing_status: string | null
          gross_amount: number
          id: string
          notes: string | null
          payment_id: string | null
          supplier_id: string
          tax_type: string | null
          wht_amount: number
          wht_rate: number
        }
        Insert: {
          certificate_date: string
          certificate_number: string
          created_at?: string | null
          created_by?: string | null
          filing_status?: string | null
          gross_amount: number
          id?: string
          notes?: string | null
          payment_id?: string | null
          supplier_id: string
          tax_type?: string | null
          wht_amount: number
          wht_rate: number
        }
        Update: {
          certificate_date?: string
          certificate_number?: string
          created_at?: string | null
          created_by?: string | null
          filing_status?: string | null
          gross_amount?: number
          id?: string
          notes?: string | null
          payment_id?: string | null
          supplier_id?: string
          tax_type?: string | null
          wht_amount?: number
          wht_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "wht_certificates_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "vendor_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wht_certificates_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_sod_conflicts: {
        Args: { _user_id: string }
        Returns: {
          conflict_name: string
          is_blocking: boolean
          risk_level: string
        }[]
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      amendment_status: "pending" | "approved" | "rejected" | "applied"
      app_role:
        | "admin"
        | "warehouse_manager"
        | "procurement"
        | "finance"
        | "viewer"
        | "sales"
        | "controller"
      bin_status: "available" | "occupied" | "reserved" | "blocked"
      blanket_order_status:
        | "draft"
        | "active"
        | "suspended"
        | "expired"
        | "closed"
      contract_status: "draft" | "active" | "expired" | "terminated" | "renewed"
      delivery_status:
        | "scheduled"
        | "in_transit"
        | "arrived"
        | "receiving"
        | "completed"
        | "cancelled"
      demand_type:
        | "forecast"
        | "sales_order"
        | "production"
        | "manual"
        | "safety_stock"
      invoice_status: "pending" | "approved" | "paid" | "overdue" | "cancelled"
      pr_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "converted"
        | "closed"
      purchase_return_status:
        | "draft"
        | "pending_pickup"
        | "shipped"
        | "received_by_supplier"
        | "credit_received"
        | "cancelled"
      registration_status: "pending" | "under_review" | "approved" | "rejected"
      return_reason:
        | "defective"
        | "wrong_item"
        | "damaged"
        | "excess"
        | "quality_issue"
        | "other"
      rfq_response_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "awarded"
        | "rejected"
      rfq_status:
        | "draft"
        | "published"
        | "responses_received"
        | "under_evaluation"
        | "awarded"
        | "closed"
        | "cancelled"
      risk_flag_type: "warning" | "critical" | "blacklisted"
      scorecard_trend: "improving" | "stable" | "declining"
      shipment_status:
        | "pending"
        | "picking"
        | "packing"
        | "shipped"
        | "delivered"
        | "cancelled"
      supplier_status: "active" | "inactive" | "pending" | "blacklisted"
      transaction_type:
        | "receipt"
        | "issue"
        | "transfer_in"
        | "transfer_out"
        | "adjustment"
        | "count"
      transfer_status: "pending" | "in_progress" | "completed" | "cancelled"
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
      amendment_status: ["pending", "approved", "rejected", "applied"],
      app_role: [
        "admin",
        "warehouse_manager",
        "procurement",
        "finance",
        "viewer",
        "sales",
        "controller",
      ],
      bin_status: ["available", "occupied", "reserved", "blocked"],
      blanket_order_status: [
        "draft",
        "active",
        "suspended",
        "expired",
        "closed",
      ],
      contract_status: ["draft", "active", "expired", "terminated", "renewed"],
      delivery_status: [
        "scheduled",
        "in_transit",
        "arrived",
        "receiving",
        "completed",
        "cancelled",
      ],
      demand_type: [
        "forecast",
        "sales_order",
        "production",
        "manual",
        "safety_stock",
      ],
      invoice_status: ["pending", "approved", "paid", "overdue", "cancelled"],
      pr_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "converted",
        "closed",
      ],
      purchase_return_status: [
        "draft",
        "pending_pickup",
        "shipped",
        "received_by_supplier",
        "credit_received",
        "cancelled",
      ],
      registration_status: ["pending", "under_review", "approved", "rejected"],
      return_reason: [
        "defective",
        "wrong_item",
        "damaged",
        "excess",
        "quality_issue",
        "other",
      ],
      rfq_response_status: [
        "draft",
        "submitted",
        "under_review",
        "awarded",
        "rejected",
      ],
      rfq_status: [
        "draft",
        "published",
        "responses_received",
        "under_evaluation",
        "awarded",
        "closed",
        "cancelled",
      ],
      risk_flag_type: ["warning", "critical", "blacklisted"],
      scorecard_trend: ["improving", "stable", "declining"],
      shipment_status: [
        "pending",
        "picking",
        "packing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      supplier_status: ["active", "inactive", "pending", "blacklisted"],
      transaction_type: [
        "receipt",
        "issue",
        "transfer_in",
        "transfer_out",
        "adjustment",
        "count",
      ],
      transfer_status: ["pending", "in_progress", "completed", "cancelled"],
    },
  },
} as const
