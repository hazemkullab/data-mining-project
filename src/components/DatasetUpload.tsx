import { useState } from 'react';
import { Upload } from 'lucide-react';

interface DatasetUploadProps {
  onDatasetLoaded: (data: {
    name: string;
    openmlId: number;
    data: Record<string, unknown>[];
  }) => void;
}

const PREDEFINED_DATASETS = [
  { name: 'Credit Approval', openmlId: 29, description: 'Credit card approval dataset' },
  { name: 'Credit Approval (Alt)', openmlId: 40981, description: 'Alternative credit approval dataset' },
  { name: 'Student Performance', openmlId: 40364, description: 'Student academic performance data' },
  { name: 'Sonar', openmlId: 40, description: 'Sonar signals classification' },
  { name: 'Segment', openmlId: 40982, description: 'Image segmentation data' },
  { name: 'Zoo', openmlId: 62, description: 'Animal classification dataset' }
];

export default function DatasetUpload({ onDatasetLoaded }: DatasetUploadProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);

        onDatasetLoaded({
          name: file.name.replace('.csv', ''),
          openmlId: 0,
          data
        });
      } catch (error) {
        alert('Error parsing CSV file: ' + (error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  const parseCSV = (text: string): Record<string, unknown>[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have at least a header and one row');

    const headers = lines[0].split(',').map(h => h.trim());
    const data: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        const value = values[index];
        if (value === '' || value === '?') {
          row[header] = null;
        } else if (!isNaN(Number(value))) {
          row[header] = Number(value);
        } else {
          row[header] = value;
        }
      });

      data.push(row);
    }

    return data;
  };

  const loadPredefinedDataset = (name: string, openmlId: number) => {
    setLoading(true);
    setSelectedDataset(name);

    setTimeout(() => {
      const sampleData = generateSampleData(name);
      onDatasetLoaded({
        name,
        openmlId,
        data: sampleData
      });
      setLoading(false);
    }, 500);
  };

  const generateSampleData = (datasetName: string): Record<string, unknown>[] => {
    if (datasetName.includes('Credit')) {
      return Array.from({ length: 100 }, (_, i) => ({
        Age: Math.floor(Math.random() * 50) + 20,
        Income: Math.floor(Math.random() * 100000) + 20000,
        CreditScore: Math.floor(Math.random() * 400) + 400,
        Employment: ['Employed', 'Self-Employed', 'Unemployed'][Math.floor(Math.random() * 3)],
        Approved: ['Yes', 'No'][Math.floor(Math.random() * 2)]
      }));
    } else if (datasetName.includes('Student')) {
      return Array.from({ length: 100 }, (_, i) => ({
        StudyTime: Math.floor(Math.random() * 10) + 1,
        Failures: Math.floor(Math.random() * 4),
        Grade: Math.floor(Math.random() * 20) + 1,
        Gender: ['M', 'F'][Math.floor(Math.random() * 2)],
        Passed: ['Yes', 'No'][Math.floor(Math.random() * 2)]
      }));
    } else if (datasetName === 'Zoo') {
      return Array.from({ length: 50 }, () => ({
        Hair: ['Yes', 'No'][Math.floor(Math.random() * 2)],
        Feathers: ['Yes', 'No'][Math.floor(Math.random() * 2)],
        Eggs: ['Yes', 'No'][Math.floor(Math.random() * 2)],
        Milk: ['Yes', 'No'][Math.floor(Math.random() * 2)],
        Legs: Math.floor(Math.random() * 8),
        Type: ['Mammal', 'Bird', 'Reptile', 'Fish'][Math.floor(Math.random() * 4)]
      }));
    }

    return Array.from({ length: 100 }, (_, i) => ({
      Feature1: Math.random(),
      Feature2: Math.random(),
      Feature3: Math.random(),
      Category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">1. Dataset Selection</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3 text-gray-700">Assigned Datasets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PREDEFINED_DATASETS.map((dataset) => (
              <button
                key={dataset.openmlId}
                onClick={() => loadPredefinedDataset(dataset.name, dataset.openmlId)}
                disabled={loading}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50"
              >
                <div className="font-semibold text-gray-800">{dataset.name}</div>
                <div className="text-sm text-gray-600 mt-1">OpenML ID: {dataset.openmlId}</div>
                <div className="text-xs text-gray-500 mt-2">{dataset.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-3 text-gray-700">Upload Custom CSV</h3>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-2 text-gray-400" />
              <p className="mb-2 text-sm text-gray-600">
                <span className="font-semibold">Click to upload</span> CSV file
              </p>
            </div>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
              disabled={loading}
            />
          </label>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading dataset...</p>
          </div>
        )}
      </div>
    </div>
  );
}