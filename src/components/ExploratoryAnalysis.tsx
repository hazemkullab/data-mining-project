import { useMemo } from 'react';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { analyzeColumn } from '../utils/preprocessing';

interface ExploratoryAnalysisProps {
  data: Record<string, unknown>[];
}

export default function ExploratoryAnalysis({ data }: ExploratoryAnalysisProps) {
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const columnAnalysis = useMemo(() => {
    return columns.map(col => analyzeColumn(data, col));
  }, [data, columns]);

  const numericColumns = columnAnalysis.filter(c => c.type === 'numeric');
  const categoricalColumns = columnAnalysis.filter(c => c.type === 'categorical');

  const renderHistogram = (columnName: string, stats: typeof columnAnalysis[0]) => {
    if (stats.type !== 'numeric' || !stats.min || !stats.max) return null;

    const values = data.map(row => row[columnName]).filter(v => v !== null && v !== undefined).map(Number);
    const bins = 10;
    const binSize = (stats.max - stats.min) / bins;

    const histogram = Array(bins).fill(0);
    values.forEach(val => {
      const binIndex = Math.min(Math.floor((val - stats.min) / binSize), bins - 1);
      histogram[binIndex]++;
    });

    const maxCount = Math.max(...histogram);

    return (
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3 flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" />
          {columnName} Distribution
        </h4>
        <div className="flex items-end h-40 space-x-1">
          {histogram.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-500 rounded-t"
                style={{ height: `${(count / maxCount) * 100}%` }}
              />
              <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                {(stats.min + i * binSize).toFixed(1)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-600 space-y-1">
          <div>Mean: {stats.mean?.toFixed(2)}, Median: {stats.median?.toFixed(2)}</div>
          <div>Range: [{stats.min?.toFixed(2)}, {stats.max?.toFixed(2)}]</div>
        </div>
      </div>
    );
  };

  const renderBarChart = (columnName: string, stats: typeof columnAnalysis[0]) => {
    if (stats.type !== 'categorical' || !stats.topValues) return null;

    const maxCount = Math.max(...stats.topValues.map(v => v.count));

    return (
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3 flex items-center">
          <PieChart className="w-4 h-4 mr-2" />
          {columnName} Distribution
        </h4>
        <div className="space-y-2">
          {stats.topValues.slice(0, 8).map((item, i) => (
            <div key={i} className="flex items-center">
              <div className="w-24 text-sm text-gray-600 truncate">{item.value}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 ml-2 relative">
                <div
                  className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                >
                  <span className="text-xs text-white font-medium">{item.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCorrelationInsights = () => {
    if (numericColumns.length < 2) return null;

    return (
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-medium text-gray-800 mb-3 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          Data Insights
        </h4>
        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <strong>Numeric Features:</strong> {numericColumns.map(c => c.name).join(', ')}
          </div>
          <div>
            <strong>Categorical Features:</strong> {categoricalColumns.map(c => c.name).join(', ')}
          </div>
          <div>
            <strong>Data Quality:</strong> {data.length} instances across {columns.length} features
          </div>
          {numericColumns.length > 0 && (
            <div>
              <strong>Numeric Ranges:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                {numericColumns.slice(0, 5).map(col => (
                  <li key={col.name}>
                    {col.name}: [{col.min?.toFixed(2)}, {col.max?.toFixed(2)}]
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">3. Exploratory Data Analysis</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-700">Summary Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Total Rows</div>
              <div className="text-3xl font-bold text-blue-700">{data.length}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Total Features</div>
              <div className="text-3xl font-bold text-green-700">{columns.length}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Numeric Features</div>
              <div className="text-3xl font-bold text-purple-700">{numericColumns.length}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Categorical Features</div>
              <div className="text-3xl font-bold text-orange-700">{categoricalColumns.length}</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-700">Data Visualizations</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {numericColumns.slice(0, 2).map(col => (
              <div key={col.name}>
                {renderHistogram(col.name, col)}
              </div>
            ))}
            {categoricalColumns.slice(0, 2).map(col => (
              <div key={col.name}>
                {renderBarChart(col.name, col)}
              </div>
            ))}
            {renderCorrelationInsights()}
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
          <h4 className="font-medium text-blue-900 mb-2">Key Observations</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>Dataset contains {data.length} instances with {columns.length} features</li>
            <li>{numericColumns.length} numeric features suitable for discretization</li>
            <li>{categoricalColumns.length} categorical features ready for association mining</li>
            <li>Visualizations show the distribution patterns across key features</li>
          </ul>
        </div>
      </div>
    </div>
  );
}