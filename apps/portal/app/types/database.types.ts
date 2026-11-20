// Replace with generated Supabase types after the first database migration:
// corepack pnpm exec supabase gen types --lang=typescript --local > app/types/database.types.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
