import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, DocumentTextIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import paperService from '../services/paperService';

const PaperDetailsPage = () => {
  const { paperId } = useParams<{ paperId: string }>();
  
  const { 
    data: paper, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['paper', paperId],
    queryFn: () => paperId ? paperService.getPaperById(paperId) : Promise.reject('No paper ID provided'),
    enabled: !!paperId
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" text="Loading paper details..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Error Loading Paper</h2>
        <p>{error instanceof Error ? error.message : 'Failed to load paper details'}</p>
        <Link to="/" className="mt-4 inline-flex items-center text-red-700 hover:text-red-800">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Return to Home
        </Link>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Paper Not Found</h2>
        <p>The requested paper could not be found.</p>
        <Link to="/" className="mt-4 inline-flex items-center text-yellow-700 hover:text-yellow-800">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/papers" className="inline-flex items-center text-blue-600 hover:text-blue-700">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to Papers
        </Link>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden mb-8">
        <div className="border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">{paper.title}</h1>
          <p className="text-gray-600 mt-1">
            {paper.authors.join(', ')} • {paper.year || 'Unknown Year'}
          </p>
          {paper.journal && (
            <p className="text-gray-600 mt-1 italic">
              {paper.journal}
            </p>
          )}
          {paper.doi && (
            <p className="text-gray-600 mt-1">
              DOI: <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-800">{paper.doi}</a>
            </p>
          )}
        </div>

        <div className="px-6 py-4">
          <div className="flex items-start mb-6">
            <div className="flex-shrink-0 mt-1">
              <DocumentTextIcon className="h-6 w-6 text-gray-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">Abstract</h3>
              <div className="mt-2 text-gray-700 space-y-2">
                <p>{paper.abstract}</p>
              </div>
            </div>
          </div>

          {paper.uniquenessScore !== undefined && (
            <div className="flex items-start mb-6">
              <div className="flex-shrink-0 mt-1">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-gray-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Uniqueness Analysis</h3>
                <div className="mt-2">
                  <div className={`text-lg font-bold ${
                    paper.uniquenessScore >= 70 ? 'text-green-600' : 
                    paper.uniquenessScore >= 30 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    Uniqueness Score: {paper.uniquenessScore}%
                  </div>
                  <p className="mt-2 text-gray-700">{paper.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {paper.similarPapers && paper.similarPapers.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Similar Papers</h3>
              <div className="space-y-4">
                {paper.similarPapers.map((similarPaper, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">{similarPaper.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {similarPaper.authors} • {similarPaper.year || 'Unknown Year'}
                    </p>
                    {similarPaper.similarity && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                          {similarPaper.similarity}% Similar
                        </span>
                      </div>
                    )}
                    {similarPaper.explanation && (
                      <p className="mt-2 text-gray-700 text-sm">{similarPaper.explanation}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaperDetailsPage; 