import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import FileUploader from '../components/FileUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import paperService from '../services/paperService';
import type { PaperUniquenessResponse } from '../services/paperService';

const PaperUniquenessPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({
    title: '',
    authors: '',
    doi: '',
    journal: '',
    year: '',
  });
  const [uniquenessResult, setUniquenessResult] = useState<PaperUniquenessResponse | null>(null);

  const checkUniquenessMutation = useMutation({
    mutationFn: ({ file, metadata }: { file: File; metadata: any }) =>
      paperService.checkPaperUniqueness(file, metadata),
    onSuccess: (data) => {
      setUniquenessResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setUniquenessResult(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      checkUniquenessMutation.mutate({ file, metadata });
    }
  };

  const renderUniquenessScore = (score: number) => {
    let color = 'text-green-600';
    let message = 'Highly unique';
    
    if (score < 30) {
      color = 'text-red-600';
      message = 'Low uniqueness';
    } else if (score < 70) {
      color = 'text-yellow-600';
      message = 'Moderately unique';
    }
    
    return (
      <div className="flex items-center space-x-2">
        <span className={`text-3xl font-bold ${color}`}>{score}%</span>
        <span className={`font-medium ${color}`}>{message}</span>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Uniqueness & Find Related Papers</h1>
        <p className="mt-2 text-gray-600">
          Check how unique your research paper is compared to existing literature.
        </p>
      </div>

      {uniquenessResult ? (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Uniqueness Results</h2>
            <button 
              onClick={() => setUniquenessResult(null)} 
              className="btn btn-secondary"
            >
              Check Another Paper
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Paper Summary</h3>
                <p className="text-gray-700 font-medium">{uniquenessResult.paper.title}</p>
                <p className="text-gray-600 mt-2">Abstract: {uniquenessResult.paper.abstract.substring(0, 200)}...</p>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Uniqueness Score</h3>
                {renderUniquenessScore(uniquenessResult.uniquenessScore)}
                <p className="mt-3 text-gray-700">{uniquenessResult.explanation}</p>
              </div>
            </div>
          </div>

          {uniquenessResult.similarPapers.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Similar Papers</h3>
              <div className="space-y-4">
                {uniquenessResult.similarPapers.map((paper, index) => (
                  <div key={paper.paperId || index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{paper.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {paper.authors} • {paper.year || 'Unknown Year'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded-lg text-sm font-medium">
                          {paper.similarity}% Similar
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-700 text-sm">{paper.explanation}</p>
                    <div className="mt-2">
                      <a 
                        href={`https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title + ' ' + paper.authors)}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Search on Google Scholar &rarr;
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <Link
              to={`/papers/${uniquenessResult.paper.id}`}
              className="btn btn-primary"
            >
              View Full Details
            </Link>
          </div>
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
              
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Paper Metadata (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="title" className="form-label">
                      Paper Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={metadata.title}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="authors" className="form-label">
                      Authors (comma separated)
                    </label>
                    <input
                      type="text"
                      id="authors"
                      name="authors"
                      value={metadata.authors}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="journal" className="form-label">
                      Journal / Conference
                    </label>
                    <input
                      type="text"
                      id="journal"
                      name="journal"
                      value={metadata.journal}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="year" className="form-label">
                      Publication Year
                    </label>
                    <input
                      type="text"
                      id="year"
                      name="year"
                      value={metadata.year}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label htmlFor="doi" className="form-label">
                      DOI (Digital Object Identifier)
                    </label>
                    <input
                      type="text"
                      id="doi"
                      name="doi"
                      value={metadata.doi}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={!file || checkUniquenessMutation.isPending}
                  className={`btn btn-primary w-full ${
                    !file || checkUniquenessMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {checkUniquenessMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner size="small" text="" />
                      <span className="ml-2">Checking uniqueness...</span>
                    </span>
                  ) : (
                    'Check Paper Uniqueness'
                  )}
                </button>
              </div>

              {checkUniquenessMutation.isError && (
                <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Error checking uniqueness</p>
                    <p className="text-sm mt-1">
                      {checkUniquenessMutation.error instanceof Error
                        ? checkUniquenessMutation.error.message
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

export default PaperUniquenessPage; 