export type Transaction = string[];
export type Itemset = Set<string>;

export interface FrequentItemsetResult {
  itemset: string[];
  support: number;
}

export interface AssociationRuleResult {
  antecedent: string[];
  consequent: string[];
  support: number;
  confidence: number;
  lift: number;
}

export function prepareTransactions(data: Record<string, unknown>[]): Transaction[] {
  return data.map(row => {
    const items: string[] = [];
    Object.entries(row).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        items.push(`${key}=${String(value)}`);
      }
    });
    return items;
  });
}

export function calculateSupport(
  itemset: string[],
  transactions: Transaction[]
): number {
  const count = transactions.filter(transaction =>
    itemset.every(item => transaction.includes(item))
  ).length;
  return count / transactions.length;
}

export function apriori(
  transactions: Transaction[],
  minSupport: number
): FrequentItemsetResult[] {
  const frequentItemsets: FrequentItemsetResult[] = [];

  const uniqueItems = new Set<string>();
  transactions.forEach(transaction => {
    transaction.forEach(item => uniqueItems.add(item));
  });

  let currentItemsets: string[][] = Array.from(uniqueItems).map(item => [item]);

  while (currentItemsets.length > 0) {
    const frequentCurrent: FrequentItemsetResult[] = [];

    for (const itemset of currentItemsets) {
      const support = calculateSupport(itemset, transactions);
      if (support >= minSupport) {
        frequentCurrent.push({ itemset, support });
      }
    }

    frequentItemsets.push(...frequentCurrent);

    if (frequentCurrent.length === 0) break;

    currentItemsets = generateCandidates(
      frequentCurrent.map(f => f.itemset)
    );
  }

  return frequentItemsets;
}

function generateCandidates(itemsets: string[][]): string[][] {
  const candidates: string[][] = [];

  for (let i = 0; i < itemsets.length; i++) {
    for (let j = i + 1; j < itemsets.length; j++) {
      const merged = [...new Set([...itemsets[i], ...itemsets[j]])].sort();

      if (merged.length === itemsets[i].length + 1) {
        const exists = candidates.some(c =>
          c.length === merged.length &&
          c.every((item, idx) => item === merged[idx])
        );
        if (!exists) {
          candidates.push(merged);
        }
      }
    }
  }

  return candidates;
}

export function generateAssociationRules(
  frequentItemsets: FrequentItemsetResult[],
  transactions: Transaction[],
  minConfidence: number
): AssociationRuleResult[] {
  const rules: AssociationRuleResult[] = [];

  const itemsetsWithMultipleItems = frequentItemsets.filter(
    f => f.itemset.length > 1
  );

  for (const { itemset, support } of itemsetsWithMultipleItems) {
    const subsets = generateSubsets(itemset);

    for (const antecedent of subsets) {
      if (antecedent.length === 0 || antecedent.length === itemset.length) {
        continue;
      }

      const consequent = itemset.filter(item => !antecedent.includes(item));

      if (consequent.length === 0) continue;

      const antecedentSupport = calculateSupport(antecedent, transactions);
      const confidence = support / antecedentSupport;

      if (confidence >= minConfidence) {
        const consequentSupport = calculateSupport(consequent, transactions);
        const lift = support / (antecedentSupport * consequentSupport);

        rules.push({
          antecedent,
          consequent,
          support,
          confidence,
          lift
        });
      }
    }
  }

  return rules.sort((a, b) => b.confidence - a.confidence);
}

function generateSubsets(items: string[]): string[][] {
  const subsets: string[][] = [[]];

  for (const item of items) {
    const length = subsets.length;
    for (let i = 0; i < length; i++) {
      subsets.push([...subsets[i], item]);
    }
  }

  return subsets.filter(s => s.length > 0 && s.length < items.length);
}

export function preprocessDataForAssociationRules(
  data: Record<string, unknown>[],
  options: {
    discretizationBins?: number;
    minCategoryFrequency?: number;
  } = {}
): Record<string, unknown>[] {
  const { discretizationBins = 4, minCategoryFrequency = 0.01 } = options;

  if (data.length === 0) return data;

  const columns = Object.keys(data[0]);
  const processedData: Record<string, unknown>[] = [];

  const columnStats: Record<string, { type: 'numeric' | 'categorical'; values?: number[] }> = {};

  columns.forEach(col => {
    const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined);
    const numericValues = values.filter(v => typeof v === 'number' || !isNaN(Number(v))).map(Number);

    if (numericValues.length / values.length > 0.8) {
      columnStats[col] = { type: 'numeric', values: numericValues };
    } else {
      columnStats[col] = { type: 'categorical' };
    }
  });

  for (const row of data) {
    const processedRow: Record<string, unknown> = {};

    for (const col of columns) {
      const value = row[col];

      if (value === null || value === undefined || value === '') {
        continue;
      }

      if (columnStats[col].type === 'numeric') {
        const numValue = Number(value);
        const values = columnStats[col].values!;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binSize = (max - min) / discretizationBins;

        if (binSize === 0) {
          processedRow[col] = `${col}_${numValue}`;
        } else {
          const binIndex = Math.min(
            Math.floor((numValue - min) / binSize),
            discretizationBins - 1
          );
          const binStart = min + binIndex * binSize;
          const binEnd = binStart + binSize;
          processedRow[col] = `${col}_[${binStart.toFixed(1)}-${binEnd.toFixed(1)})`;
        }
      } else {
        processedRow[col] = String(value);
      }
    }

    processedData.push(processedRow);
  }

  return processedData;
}