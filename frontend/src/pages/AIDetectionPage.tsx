import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleBottomCenterTextIcon,
  ShieldCheckIcon,
  ScaleIcon,
  SparklesIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import FileUploader from '../components/FileUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import paperService from '../services/paperService';
import type { AIDetectionResponse } from '../services/paperService';

const AIDetectionPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>('');
  const [uploadType, setUploadType] = useState<'file' | 'text'>('file');
  const [detectionResult, setDetectionResult] =
    useState<AIDetectionResponse | null>(null);

  const detectAIMutation = useMutation({
    mutationFn: (fileOrText: File | string) =>
      paperService.detectAI(fileOrText),
    onSuccess: (data) => {
      setDetectionResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setText(''); // Clear text input when file is selected
    setDetectionResult(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setFile(null); // Clear file input when text is entered
    setDetectionResult(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadType === 'file' && file) {
      detectAIMutation.mutate(file);
    } else if (uploadType === 'text' && text.trim().length >= 100) {
      detectAIMutation.mutate(text);
    } else if (uploadType === 'text' && text.trim().length < 100) {
      // Optionally show a more specific error for short text
      alert("Text should be at least 100 characters for accurate detection.");
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence?.toLowerCase()) {
      case 'high':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'high':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'none':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const renderScoreBar = (score: number, label: string, confidence: string) => {
    let actualScore = score;
    // Apply the threshold: if score < 20, display as 0 for specific labels
    if ((label.toLowerCase().includes('likelihood ai generated') || label.toLowerCase().includes('likelihood humanized')) && actualScore < 20) {
        actualScore = 0;
    }

    const percentage = Math.max(0, Math.min(100, actualScore)); // Clamp score between 0 and 100
    let barColor = 'bg-gray-400';
    if (label.toLowerCase().includes('ai generated')) {
        barColor = percentage >= 75 ? 'bg-red-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-green-500';
    } else if (label.toLowerCase().includes('humanized')) {
        barColor = percentage >= 75 ? 'bg-yellow-500' : percentage >= 50 ? 'bg-orange-500' : 'bg-blue-500';
    }


    return (
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm font-medium text-gray-700">
            {percentage.toFixed(0)}%
            {confidence && (
              <span className={`ml-2 font-semibold ${getConfidenceColor(confidence)}`}>
                ({confidence})
              </span>
            )}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${barColor}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const ResultCard: React.FC<{
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    className?: string;
  }> = ({ title, icon: Icon, children, className }) => (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex items-center mb-4">
          <Icon className="h-8 w-8 text-blue-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
          Advanced Text Analysis
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Upload a PDF or paste text to assess AI generation, humanization, plagiarism risk, and more.
        </p>
      </div>

      {detectionResult?.success && detectionResult.result ? (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <button 
              onClick={() => setDetectionResult(null)} 
              className="btn btn-primary btn-lg"
            >
              Analyze Another Text
            </button>
          </div>

          <ResultCard title="Overall Assessment" icon={DocumentMagnifyingGlassIcon}>
            <p className="text-gray-700 text-lg">
              {detectionResult.result.overallAssessment}
            </p>
          </ResultCard>

          <div className="grid md:grid-cols-2 gap-8">
            <ResultCard title="AI Generation Analysis" icon={XCircleIcon}>
              {renderScoreBar(
                detectionResult.result.aiScore,
                'Likelihood AI Generated',
                detectionResult.result.aiConfidence
              )}
              <p className="text-sm text-gray-600 mt-2">
                {detectionResult.result.aiExplanation}
              </p>
            </ResultCard>

            <ResultCard title="Humanization Analysis" icon={SparklesIcon}>
              {renderScoreBar(
                detectionResult.result.humanizationScore,
                'Likelihood Humanized',
                detectionResult.result.humanizationConfidence
              )}
              <p className="text-sm text-gray-600 mt-2">
                {detectionResult.result.humanizationExplanation}
              </p>
            </ResultCard>
          </div>

          <ResultCard title="Plagiarism & Originality" icon={ShieldCheckIcon}>
            <div className={`p-4 border rounded-lg ${getRiskColor(detectionResult.result.plagiarismRisk)}`}>
              <h4 className="font-semibold text-lg mb-1">
                Plagiarism Risk: {detectionResult.result.plagiarismRisk}
              </h4>
              <p className="text-sm">
                {detectionResult.result.plagiarismExplanation}
              </p>
            </div>
          </ResultCard>
          
          <ResultCard title="Additional Analytics" icon={ScaleIcon}>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium text-gray-800">Readability Level:</p>
                    <p className="text-gray-600">{detectionResult.result.readabilityLevel}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-md">
                    <p className="font-medium text-gray-800">Sentiment:</p>
                    <p className="text-gray-600">{detectionResult.result.sentiment}</p>
                </div>
            </div>
          </ResultCard>

        </div>
      ) : detectionResult && !detectionResult.success ? (
         <div className="mt-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
            <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="font-medium">Error fetching detection results.</p>
            </div>
            <p className="text-sm mt-1 ml-7">Could not retrieve analysis data. Please try again.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex border-b border-gray-200 mb-6">
              {['file', 'text'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUploadType(type as 'file' | 'text')}
                  className={`py-3 px-6 border-b-2 font-semibold text-base focus:outline-none ${
                    uploadType === type
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type === 'file' ? 'Upload PDF' : 'Paste Text'}
                </button>
              ))}
            </div>
            
            <form onSubmit={handleSubmit}>
              {uploadType === 'file' ? (
                <FileUploader
                  onFileSelect={handleFileSelect}
                  accept=".pdf, .txt, .md, .docx" // Allow more file types
                  label="Upload Document (PDF, TXT, DOCX, MD)"
                />
              ) : (
                <div>
                  <label htmlFor="text" className="form-label">
                    Paste Text to Analyze (min. 100 characters)
                  </label>
                  <textarea
                    id="text"
                    rows={12}
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Paste the text you want to analyze..."
                    className="form-input mt-1 w-full text-sm font-mono"
                  />
                  {text && text.trim().length > 0 && text.trim().length < 100 && (
                    <p className="form-error text-xs mt-1">
                      Please provide at least 100 characters for better analysis.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={
                    (uploadType === 'file' && !file) ||
                    (uploadType === 'text' && text.trim().length < 100) ||
                    detectAIMutation.isPending
                  }
                  className="btn btn-primary btn-lg w-full"
                >
                  {detectAIMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner size="small" />
                      <span className="ml-2">Analyzing...</span>
                    </span>
                  ) : (
                    'Analyze Text'
                  )}
                </button>
              </div>

              {detectAIMutation.isError && (
                <div className="mt-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-700 flex items-start">
                  <ExclamationTriangleIcon className="h-6 w-6 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Analysis Error</p>
                    <p className="text-sm mt-1">
                      {detectAIMutation.error instanceof Error
                        ? detectAIMutation.error.message
                        : 'An unexpected error occurred. Please try again or check the console for details.'}
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

export default AIDetectionPage; 