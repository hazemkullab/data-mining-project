import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Dataset = {
  id: string;
  name: string;
  openml_id: number | null;
  description: string;
  num_instances: number;
  num_features: number;
  uploaded_at: string;
  data: Record<string, unknown>;
};

export type AssociationRule = {
  id: string;
  dataset_id: string;
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
  created_at: string;
};

export type FrequentItemset = {
  id: string;
  dataset_id: string;
  items: string[];
  support: number;
  created_at: string;
};

export type PreprocessingResult = {
  id: string;
  dataset_id: string;
  missing_values: Record<string, unknown>;
  outliers: Record<string, unknown>;
  encodings: Record<string, unknown>;
  normalization: Record<string, unknown>;
  created_at: string;
};