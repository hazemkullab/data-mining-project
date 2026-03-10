/*
  # Data Mining Project Schema

  1. New Tables
    - `datasets`
      - `id` (uuid, primary key)
      - `name` (text) - Dataset name
      - `openml_id` (integer) - OpenML dataset ID
      - `description` (text) - Dataset description
      - `num_instances` (integer) - Number of rows
      - `num_features` (integer) - Number of columns
      - `uploaded_at` (timestamptz) - Upload timestamp
      - `data` (jsonb) - Actual dataset in JSON format
      
    - `preprocessing_results`
      - `id` (uuid, primary key)
      - `dataset_id` (uuid, foreign key)
      - `missing_values` (jsonb) - Missing value statistics
      - `outliers` (jsonb) - Outlier detection results
      - `encodings` (jsonb) - Categorical encoding info
      - `normalization` (jsonb) - Normalization parameters
      - `created_at` (timestamptz)
      
    - `association_rules`
      - `id` (uuid, primary key)
      - `dataset_id` (uuid, foreign key)
      - `antecedent` (text[]) - Items in antecedent
      - `consequent` (text[]) - Items in consequent
      - `support` (numeric) - Support value
      - `confidence` (numeric) - Confidence value
      - `lift` (numeric) - Lift value
      - `created_at` (timestamptz)
      
    - `frequent_itemsets`
      - `id` (uuid, primary key)
      - `dataset_id` (uuid, foreign key)
      - `items` (text[]) - Items in the itemset
      - `support` (numeric) - Support value
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (educational project)
*/

CREATE TABLE IF NOT EXISTS datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  openml_id integer,
  description text DEFAULT '',
  num_instances integer DEFAULT 0,
  num_features integer DEFAULT 0,
  uploaded_at timestamptz DEFAULT now(),
  data jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS preprocessing_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid REFERENCES datasets(id) ON DELETE CASCADE,
  missing_values jsonb DEFAULT '{}'::jsonb,
  outliers jsonb DEFAULT '{}'::jsonb,
  encodings jsonb DEFAULT '{}'::jsonb,
  normalization jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS association_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid REFERENCES datasets(id) ON DELETE CASCADE,
  antecedent text[] DEFAULT ARRAY[]::text[],
  consequent text[] DEFAULT ARRAY[]::text[],
  support numeric DEFAULT 0,
  confidence numeric DEFAULT 0,
  lift numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS frequent_itemsets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id uuid REFERENCES datasets(id) ON DELETE CASCADE,
  items text[] DEFAULT ARRAY[]::text[],
  support numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE preprocessing_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE association_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE frequent_itemsets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read datasets"
  ON datasets FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert datasets"
  ON datasets FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update datasets"
  ON datasets FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete datasets"
  ON datasets FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Public can read preprocessing_results"
  ON preprocessing_results FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert preprocessing_results"
  ON preprocessing_results FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can read association_rules"
  ON association_rules FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert association_rules"
  ON association_rules FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can delete association_rules"
  ON association_rules FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Public can read frequent_itemsets"
  ON frequent_itemsets FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert frequent_itemsets"
  ON frequent_itemsets FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can delete frequent_itemsets"
  ON frequent_itemsets FOR DELETE
  TO public
  USING (true);