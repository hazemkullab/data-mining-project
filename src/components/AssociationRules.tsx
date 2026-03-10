import { useState } from 'react';
import { Play, Download, TrendingUp } from 'lucide-react';
import {
  prepareTransactions,
  apriori,
  generateAssociationRules,
  preprocessDataForAssociationRules,
  type FrequentItemsetResult,
  type AssociationRuleResult
} from '../utils/associationRules';
import { supabase } from '../lib/supabase';

interface AssociationRulesProps {
  data: Record<string, unknown>[];
  datasetId?: string;
}

export default function AssociationRules({ data, datasetId }: AssociationRulesProps) {
  const [minSupport, setMinSupport] = useState(0.2);
  const [minConfidence, setMinConfidence] = useState(0.6);
  const [discretizationBins, setDiscretizationBins] = useState(4);
  const [frequentItemsets, setFrequentItemsets] = useState<FrequentItemsetResult[]>([]);
  const [rules, setRules] = useState<AssociationRuleResult[]>([]);
  const [mining, setMining] = useState(false);
  const [completed, setCompleted] = useState(false);

  const runMining = async () => {
    setMining(true);
    setCompleted(false);

    try {
      const preprocessed = preprocessDataForAssociationRules(data, {
        discretizationBins,
        minCategoryFrequency: 0.01
      });

      const transactions = prepareTransactions(preprocessed);

      const itemsets = apriori(transactions, minSupport);
      setFrequentItemsets(itemsets);

      const associationRules = generateAssociationRules(
        itemsets,
        transactions,
        minConfidence
      );
      setRules(associationRules);

      if (datasetId) {
        await supabase.from('frequent_itemsets').delete().eq('dataset_id', datasetId);

        if (itemsets.length > 0) {
          await supabase.from('frequent_itemsets').insert(
            itemsets.slice(0, 50).map(item => ({
              dataset_id: datasetId,
              items: item.itemset,
              support: item.support
            }))
          );
        }

        await supabase.from('association_rules').delete().eq('dataset_id', datasetId);

        if (associationRules.length > 0) {
          await supabase.from('association_rules').insert(
            associationRules.slice(0, 50).map(rule => ({
              dataset_id: datasetId,
              antecedent: rule.antecedent,
              consequent: rule.consequent,
              support: rule.support,
              confidence: rule.confidence,
              lift: rule.lift
            }))
          );
        }
      }

      setCompleted(true);
    } catch (error) {
      console.error('Mining error:', error);
      alert('Error during mining: ' + (error as Error).message);
    } finally {
      setMining(false);
    }
  };

  const downloadResults = () => {
    const results = {
      frequentItemsets: frequentItemsets.slice(0, 20),
      associationRules: rules.slice(0, 20),
      parameters: { minSupport, minConfidence, discretizationBins }
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'association_rules_results.json';
    a.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">4. Association Rules Mining</h2>

      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3 text-gray-700">Mining Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Support ({(minSupport * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0.05"
                max="0.5"
                step="0.05"
                value={minSupport}
                onChange={(e) => setMinSupport(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">
                Items must appear in at least {(minSupport * 100).toFixed(0)}% of transactions
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Confidence ({(minConfidence * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">
                Rules must be correct at least {(minConfidence * 100).toFixed(0)}% of the time
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discretization Bins ({discretizationBins})
              </label>
              <input
                type="range"
                min="2"
                max="10"
                step="1"
                value={discretizationBins}
                onChange={(e) => setDiscretizationBins(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">
                Number of bins for numeric feature discretization
              </div>
            </div>
          </div>

          <button
            onClick={runMining}
            disabled={mining}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            <Play className="w-4 h-4 mr-2" />
            {mining ? 'Mining...' : 'Run Association Mining'}
          </button>
        </div>

        {mining && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Mining association rules...</p>
          </div>
        )}

        {completed && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Frequent Itemsets Found</div>
                <div className="text-3xl font-bold text-blue-700">{frequentItemsets.length}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Association Rules Generated</div>
                <div className="text-3xl font-bold text-green-700">{rules.length}</div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-700">Top Frequent Itemsets</h3>
              </div>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Itemset</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Support</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {frequentItemsets.slice(0, 15).map((itemset, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          <div className="flex flex-wrap gap-1">
                            {itemset.itemset.map((item, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                {item}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{(itemset.support * 100).toFixed(2)}%</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{itemset.itemset.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-700 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Top Association Rules
                </h3>
                <button
                  onClick={downloadResults}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </button>
              </div>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Antecedent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Consequent</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Support</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lift</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rules.slice(0, 10).map((rule, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          <div className="flex flex-wrap gap-1">
                            {rule.antecedent.map((item, i) => (
                              <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                {item}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          <div className="flex flex-wrap gap-1">
                            {rule.consequent.map((item, i) => (
                              <span key={i} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                                {item}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{(rule.support * 100).toFixed(2)}%</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{(rule.confidence * 100).toFixed(2)}%</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{rule.lift.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
              <h4 className="font-medium text-blue-900 mb-2">Rule Interpretation</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li><strong>Support:</strong> How frequently the itemset appears in the dataset</li>
                <li><strong>Confidence:</strong> How often the rule is correct (antecedent → consequent)</li>
                <li><strong>Lift:</strong> How much more likely consequent is given antecedent (lift &gt; 1 means positive correlation)</li>
                <li><strong>Algorithm:</strong> Apriori algorithm with customizable thresholds</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}