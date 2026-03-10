import { useState } from 'react';
import { Database, FileText } from 'lucide-react';
import DatasetUpload from './components/DatasetUpload';
import DataPreprocessing from './components/DataPreprocessing';
import ExploratoryAnalysis from './components/ExploratoryAnalysis';
import AssociationRules from './components/AssociationRules';
import { supabase } from './lib/supabase';

function App() {
  const [dataset, setDataset] = useState<{
    id?: string;
    name: string;
    openmlId: number;
    data: Record<string, unknown>[];
  } | null>(null);
  const [preprocessedData, setPreprocessedData] = useState<Record<string, unknown>[]>([]);

  const handleDatasetLoaded = async (loadedDataset: {
    name: string;
    openmlId: number;
    data: Record<string, unknown>[];
  }) => {
    const { data: insertedData, error } = await supabase
      .from('datasets')
      .insert({
        name: loadedDataset.name,
        openml_id: loadedDataset.openmlId,
        description: `Dataset for association rules mining`,
        num_instances: loadedDataset.data.length,
        num_features: Object.keys(loadedDataset.data[0] || {}).length,
        data: loadedDataset.data as any
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Error saving dataset:', error);
    }

    setDataset({
      id: insertedData?.id,
      name: loadedDataset.name,
      openmlId: loadedDataset.openmlId,
      data: loadedDataset.data
    });
    setPreprocessedData(loadedDataset.data);
  };

  const handlePreprocessed = (processedData: Record<string, unknown>[]) => {
    setPreprocessedData(processedData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Data Mining Project: Association Rules
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Complete pipeline for association rule mining on OpenML datasets
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-600">
          <div className="flex items-start space-x-3">
            <FileText className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Project Overview</h2>
              <p className="text-gray-700 mb-2">
                This application implements a complete data mining pipeline for association rule mining,
                following the course project requirements:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Dataset Understanding & Loading (predefined OpenML datasets or custom CSV)</li>
                <li>Data Preprocessing (missing values, outliers, encoding)</li>
                <li>Exploratory Data Analysis (summary statistics, visualizations)</li>
                <li>Association Rules Mining (Apriori algorithm with customizable parameters)</li>
                <li>Results Evaluation & Interpretation (support, confidence, lift metrics)</li>
              </ul>
            </div>
          </div>
        </div>

        <DatasetUpload onDatasetLoaded={handleDatasetLoaded} />

        {dataset && (
          <>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-600">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-green-600" />
                <div>
                  <span className="font-semibold text-gray-900">{dataset.name}</span>
                  <span className="text-gray-600 ml-2">
                    (OpenML ID: {dataset.openmlId}) - {dataset.data.length} instances,{' '}
                    {Object.keys(dataset.data[0] || {}).length} features
                  </span>
                </div>
              </div>
            </div>

            <DataPreprocessing data={dataset.data} onPreprocessed={handlePreprocessed} />

            {preprocessedData.length > 0 && (
              <>
                <ExploratoryAnalysis data={preprocessedData} />
                <AssociationRules data={preprocessedData} datasetId={dataset.id} />
              </>
            )}
          </>
        )}

        {!dataset && (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Dataset Loaded</h3>
            <p className="text-gray-600">
              Select a predefined dataset or upload your own CSV file to begin the analysis
            </p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>Data Mining Course Project - Association Rules Mining</p>
          <p className="mt-1">Assigned Datasets: Credit Approval, Student Performance, Sonar, Segment, Zoo</p>
        </div>
      </footer>
    </div>
  );
}

export default App;