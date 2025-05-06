import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import FileUploader from '../components/FileUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import paperService from '../services/paperService';
import type { PaperAnalysisResponse, StructureCheckResponse } from '../services/paperService';

const SynopsisSelector = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void 
}) => {
  return (
    <div className="mt-6">
      <label className="form-label">Synopsis Detail Level</label>
      <div className="mt-2 grid grid-cols-3 gap-3">
        {['brief', 'moderate', 'detailed'].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`py-2 px-4 rounded-md border ${
              value === option
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            } text-sm font-medium capitalize`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

const PaperAnalysisPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [synopsisType, setSynopsisType] = useState<string>('moderate');
  const [analysisResult, setAnalysisResult] = useState<PaperAnalysisResponse | null>(null);
  const [structureCheckResult, setStructureCheckResult] = useState<StructureCheckResponse | null>(null);

  const analyzePaperMutation = useMutation({
    mutationFn: ({ file, synopsisType }: { file: File; synopsisType: string }) =>
      paperService.analyzePaper(file, synopsisType),
    onSuccess: (data, variables) => {
      setAnalysisResult(data);
      if (data.success && variables.file) {
        checkStructureMutation.mutate({ file: variables.file, format: 'ieee' });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const checkStructureMutation = useMutation<StructureCheckResponse, Error, { file: File; format: string }>({ 
    mutationFn: ({ file, format }) => paperService.checkPaperStructure(file, format),
    onSuccess: (data) => {
      if (data.success) {
        setStructureCheckResult(data);
      } else {
        console.warn("Secondary structure check failed:", data.message);
        setStructureCheckResult(null);
      }
    },
    onError: (error) => {
       console.warn("API Error during secondary structure check:", error);
       setStructureCheckResult(null); 
    }
  });

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setAnalysisResult(null);
    setStructureCheckResult(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      analyzePaperMutation.mutate({ file, synopsisType });
    }
  };

  const ScoreCard = ({ 
    title, 
    score, 
    justification 
  }: { 
    title: string; 
    score: number; 
    justification: string 
  }) => (
    <div className="p-4 rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <div className="flex items-center">
          <span className={`text-lg font-bold ${
            score >= 8 ? 'text-green-600' : score >= 5 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {score}/10
          </span>
        </div>
      </div>
      <p className="text-gray-600 text-sm">{justification}</p>
    </div>
  );

  const RiskCard = ({ 
    title, 
    level, 
    description 
  }: { 
    title: string; 
    level: string; 
    description: string 
  }) => {
    const getLevelColor = () => {
      switch (level.toLowerCase()) {
        case 'low': return 'text-green-600';
        case 'medium': return 'text-yellow-600';
        case 'high': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };

    return (
      <div className="p-4 rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <span className={`font-medium ${getLevelColor()}`}>{level}</span>
        </div>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Paper Analysis</h1>
        <p className="mt-2 text-gray-600">
          Upload a research paper to analyze its feasibility, innovation, and scalability.
        </p>
      </div>

      {analysisResult ? (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
            <button 
              onClick={() => setAnalysisResult(null)} 
              className="btn btn-secondary"
            >
              Analyze Another Paper
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Synopsis</h3>
              <p className="text-gray-700">{analysisResult.analysis.synopsis}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <ScoreCard 
              title="Feasibility" 
              score={analysisResult.analysis.scores.feasibility.score} 
              justification={analysisResult.analysis.scores.feasibility.justification} 
            />
            <ScoreCard 
              title="Innovation" 
              score={analysisResult.analysis.scores.innovation.score} 
              justification={analysisResult.analysis.scores.innovation.justification} 
            />
            <ScoreCard 
              title="Scalability" 
              score={analysisResult.analysis.scores.scalability.score} 
              justification={analysisResult.analysis.scores.scalability.justification} 
            />
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-4">Potential Risks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <RiskCard 
              title="Bias Risk" 
              level={analysisResult.analysis.risks.bias.level} 
              description={analysisResult.analysis.risks.bias.description}
            />
            <RiskCard 
              title="Edge Cases" 
              level={analysisResult.analysis.risks.edgeCases.level} 
              description={analysisResult.analysis.risks.edgeCases.description}
            />
            <RiskCard 
              title="Ethical Considerations" 
              level={analysisResult.analysis.risks.ethical.level} 
              description={analysisResult.analysis.risks.ethical.description}
            />
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {analysisResult.analysis.keywords.map((keyword, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {checkStructureMutation.isPending && (
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 text-center mb-8">
                 <LoadingSpinner size="small" text="Checking structure..." />
              </div>
          )}
          {structureCheckResult && (
             <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Structure Compliance ({structureCheckResult.formatChecked.toUpperCase()})</h3>
                  <div className="flex items-baseline space-x-2 mb-3">
                     <span className={`text-lg font-bold ${structureCheckResult.complianceScore < 40 ? 'text-red-600' : structureCheckResult.complianceScore < 75 ? 'text-yellow-600' : 'text-green-600'}`}>
                       {structureCheckResult.complianceScore}/100
                     </span>
                     {structureCheckResult.detectedFormat && structureCheckResult.detectedFormat !== "Unknown" && structureCheckResult.detectedFormat.toLowerCase() !== structureCheckResult.formatChecked.toLowerCase() && (
                       <span className="text-sm text-gray-600">(Detected Format: {structureCheckResult.detectedFormat})</span>
                     )}
                  </div>
                  <Link 
                    to="/paper-structure-check" 
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Format paper or get detailed structure analysis &rarr;
                  </Link>
                </div>
             </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <FileUploader
                onFileSelect={handleFileSelect}
                accept=".pdf"
                label="Upload Research Paper (PDF)"
              />
              
              <SynopsisSelector value={synopsisType} onChange={setSynopsisType} />

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={!file || analyzePaperMutation.isPending}
                  className={`btn btn-primary w-full ${
                    !file || analyzePaperMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {analyzePaperMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner size="small" text="" />
                      <span className="ml-2">Analyzing...</span>
                    </span>
                  ) : (
                    'Analyze Paper'
                  )}
                </button>
              </div>

              {analyzePaperMutation.isError && (
                <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Error analyzing paper</p>
                    <p className="text-sm mt-1">
                      {analyzePaperMutation.error instanceof Error
                        ? analyzePaperMutation.error.message
                        : 'An unexpected error occurred. Please try again.'}
                    </p>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaperAnalysisPage; 