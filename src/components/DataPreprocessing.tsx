import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { analyzeColumn, detectOutliers, handleMissingValues } from '../utils/preprocessing';
import type { ColumnStats } from '../utils/preprocessing';

interface DataPreprocessingProps {
  data: Record<string, unknown>[];
  onPreprocessed: (processedData: Record<string, unknown>[]) => void;
}

export default function DataPreprocessing({ data, onPreprocessed }: DataPreprocessingProps) {
  const [columnStats, setColumnStats] = useState<ColumnStats[]>([]);
  const [outlierResults, setOutlierResults] = useState<Record<string, number>>({});
  const [missingStrategy, setMissingStrategy] = useState<'remove' | 'mean' | 'median' | 'mode'>('remove');
  const [processedData, setProcessedData] = useState<Record<string, unknown>[]>(data);

  useEffect(() => {
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    const stats = columns.map(col => analyzeColumn(data, col));
    setColumnStats(stats);

    const outliers: Record<string, number> = {};
    columns.forEach(col => {
      const result = detectOutliers(data, col);
      outliers[col] = result.indices.length;
    });
    setOutlierResults(outliers);
  }, [data]);

  const handlePreprocess = () => {
    let processed = handleMissingValues(data, missingStrategy);
    setProcessedData(processed);
    onPreprocessed(processed);
  };

  const totalMissing = columnStats.reduce((sum, stat) => sum + stat.missing, 0);
  const totalOutliers = Object.values(outlierResults).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">2. Data Preprocessing</h2>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Instances</div>
            <div className="text-2xl font-bold text-blue-600">{data.length}</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Missing Values</div>
            <div className="text-2xl font-bold text-orange-600">{totalMissing}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Outliers Detected</div>
            <div className="text-2xl font-bold text-purple-600">{totalOutliers}</div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-700">Column Statistics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Column</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missing</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unique</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outliers</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {columnStats.map((stat) => (
                  <tr key={stat.name}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{stat.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded text-xs ${stat.type === 'numeric' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {stat.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {stat.missing > 0 ? (
                        <span className="flex items-center text-orange-600">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {stat.missing}
                        </span>
                      ) : (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          0
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{stat.unique}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{outlierResults[stat.name] || 0}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {stat.type === 'numeric' ? (
                        <div>
                          Mean: {stat.mean?.toFixed(2)} | Range: [{stat.min?.toFixed(2)}, {stat.max?.toFixed(2)}]
                        </div>
                      ) : (
                        <div>
                          Top: {stat.topValues?.[0]?.value} ({stat.topValues?.[0]?.count})
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3 text-gray-700">Preprocessing Options</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Missing Value Strategy
              </label>
              <select
                value={missingStrategy}
                onChange={(e) => setMissingStrategy(e.target.value as any)}
                className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="remove">Remove rows with missing values</option>
                <option value="mean">Fill with mean (numeric) / mode (categorical)</option>
                <option value="median">Fill with median (numeric) / mode (categorical)</option>
                <option value="mode">Fill with mode</option>
              </select>
            </div>

            <button
              onClick={handlePreprocess}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Preprocessing
            </button>

            {processedData.length !== data.length && (
              <div className="text-sm text-gray-600 mt-2">
                Processed: {processedData.length} rows (removed {data.length - processedData.length} rows)
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
          <h4 className="font-medium text-blue-900 mb-2">Preprocessing Justification</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li><strong>Missing Values:</strong> Strategy selected based on data characteristics</li>
            <li><strong>Outliers:</strong> Detected using IQR method (Q1 - 1.5*IQR, Q3 + 1.5*IQR)</li>
            <li><strong>Categorical Encoding:</strong> Will be applied during association rule mining</li>
            <li><strong>Normalization:</strong> Not required for association rule mining</li>
          </ul>
        </div>
      </div>
    </div>
  );
}