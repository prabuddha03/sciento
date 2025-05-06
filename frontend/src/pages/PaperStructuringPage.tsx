import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowDownTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import FileUploader from '../components/FileUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import paperService from '../services/paperService';
import type { PaperStructuringResponse } from '../services/paperService';

const PAPER_FORMATS = [
  { id: 'ieee', name: 'IEEE' },
  { id: 'acm', name: 'ACM' },
  { id: 'apa', name: 'APA' },
  { id: 'mla', name: 'MLA' },
  { id: 'chicago', name: 'Chicago' },
  { id: 'harvard', name: 'Harvard' }
];

const FormatSelector = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) => {
  return (
    <div className="mt-6">
      <label className="form-label">Select Output Format</label>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {PAPER_FORMATS.map((format) => (
          <button
            key={format.id}
            type="button"
            onClick={() => onChange(format.id)}
            className={`py-2 px-4 rounded-md border ${
              value === format.id
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            } text-sm font-medium`}
          >
            {format.name}
          </button>
        ))}
      </div>
    </div>
  );
};

interface SectionInput {
  title: string;
  content: string;
}

// New state to hold simpler results from file upload
interface StructureResultData {
  formattedPaper: string;
  format: string;
  detectedFormat?: string; // Optional: add if you want to display it
}

// Define type for manual paper data submission
interface ManualPaperData {
  title: string;
  authors: string[];
  abstract: string;
  sections: Array<{ title: string; content: string }>;
  references?: string[];
}

const PaperStructuringPage = () => {
  const [activeMode, setActiveMode] = useState<'file' | 'manual'>('file');
  
  // File upload mode
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<string>('ieee');
  const [metadata, setMetadata] = useState({
    title: '',
    authors: '',
    abstract: '',
    keywords: ''
  });
  
  // Manual input mode
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthors, setManualAuthors] = useState('');
  const [manualAbstract, setManualAbstract] = useState('');
  const [manualSections, setManualSections] = useState<SectionInput[]>([
    { title: 'Introduction', content: '' },
    { title: 'Methodology', content: '' },
    { title: 'Results', content: '' },
    { title: 'Discussion', content: '' },
    { title: 'Conclusion', content: '' }
  ]);
  const [manualReferences, setManualReferences] = useState('');
  const [manualFormat, setManualFormat] = useState<string>('ieee');
  
  // Result state adjusted
  const [structureResult, setStructureResult] = useState<StructureResultData | null>(null);

  // File upload mutation
  const structurePaperMutation = useMutation<PaperStructuringResponse, Error, { file: File; format: string; metadata: Record<string, string> }>({
    mutationFn: ({ file, format, metadata }: { file: File; format: string; metadata: Record<string, string> }) =>
      paperService.structurePaper(file, format, metadata),
    onSuccess: (data) => {
      // Adapt to the actual response structure from the backend
      if (data.success && data.formattedPaper) {
        setStructureResult({
          formattedPaper: data.formattedPaper,
          format: data.format, // Use the format from the response
          // detectedFormat: data.detectedFormat, // Uncomment to store/use detected format
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Handle case where backend indicates failure or unexpected structure
        console.error("Structuring failed or returned unexpected data:", data);
        // Maybe set an error state here to show to the user
        setStructureResult(null); 
      }
    },
    onError: (error) => {
      // Handle network/server errors
      console.error("Error calling structurePaper API:", error);
      setStructureResult(null);
    }
  });

  // Manual input mutation (Assuming it returns the complex PaperStructuringResponse)
  const structurePaperFromTextMutation = useMutation<PaperStructuringResponse, Error, { paperData: ManualPaperData; format: string }>({
    mutationFn: ({ paperData, format }: { paperData: ManualPaperData; format: string }) =>
      paperService.structurePaperFromText(paperData, format),
    onSuccess: (data) => {
      if (data.success && data.formattedPaper) {
         // Adapt the complex response to the simpler state for display
         setStructureResult({
          formattedPaper: data.formattedPaper,
          format: data.format,
          // No detectedFormat in this path
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
         console.error("Structuring from text failed or returned unexpected data:", data);
         setStructureResult(null);
      }
    },
    onError: (error) => {
      console.error("Error calling structurePaperFromText API:", error);
      setStructureResult(null);
    }
  });

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setStructureResult(null);
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSection = () => {
    setManualSections([...manualSections, { title: '', content: '' }]);
  };

  const handleRemoveSection = (index: number) => {
    setManualSections(manualSections.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index: number, field: 'title' | 'content', value: string) => {
    const updatedSections = [...manualSections];
    updatedSections[index][field] = value;
    setManualSections(updatedSections);
  };

  const handleFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      structurePaperMutation.mutate({ file, format, metadata });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use the defined type when creating the object
    const paperData: ManualPaperData = { 
      title: manualTitle,
      authors: manualAuthors.split(',').map(author => author.trim()),
      abstract: manualAbstract,
      sections: manualSections,
      references: manualReferences.split('\n').filter(ref => ref.trim() !== '')
    };
    
    structurePaperFromTextMutation.mutate({ paperData, format: manualFormat });
  };

  const downloadFormattedPaper = () => {
    if (!structureResult || !structureResult.formattedPaper) return;
    
    const blob = new Blob([structureResult.formattedPaper], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Use the actual format stored in state for the filename
    a.download = `paper_${structureResult.format}.txt`; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Paper Structuring</h1>
        <p className="mt-2 text-gray-600">
          Format your research paper according to academic standards IEEE, APA, etc.
        </p>
      </div>

      {structureResult ? (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Formatted Paper</h2>
            <div className="flex space-x-3">
              <button 
                onClick={downloadFormattedPaper} 
                className="btn btn-primary flex items-center"
                disabled={!structureResult.formattedPaper}
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-1.5" />
                Download Document
              </button>
              <button 
                onClick={() => setStructureResult(null)} 
                className="btn btn-secondary"
              >
                Format Another Paper
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Paper Formatted in {structureResult.format.toUpperCase()} Style
              </h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 font-mono text-sm whitespace-pre-wrap overflow-auto max-h-[600px]">
                {structureResult.formattedPaper}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveMode('file')}
                className={`py-3 px-4 border-b-2 font-medium text-sm ${
                  activeMode === 'file'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upload Paper
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('manual')}
                className={`py-3 px-4 border-b-2 font-medium text-sm ${
                  activeMode === 'manual'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Manual Entry
              </button>
            </div>
            
            {activeMode === 'file' ? (
              <form onSubmit={handleFileSubmit} className="mt-6 space-y-6">
                <FileUploader
                  onFileSelect={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt"
                  label="Upload Research Paper"
                />
                
                <FormatSelector value={format} onChange={setFormat} />
                
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Optional Metadata</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    If the uploaded file is missing any of this information, you can provide it here.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="title" className="form-label">Paper Title</label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={metadata.title}
                        onChange={handleMetadataChange}
                        className="form-input"
                        placeholder="Enter paper title if not in document"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="authors" className="form-label">Authors (comma separated)</label>
                      <input
                        type="text"
                        id="authors"
                        name="authors"
                        value={metadata.authors}
                        onChange={handleMetadataChange}
                        className="form-input"
                        placeholder="e.g., John Smith, Jane Doe"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="abstract" className="form-label">Abstract</label>
                      <textarea
                        id="abstract"
                        name="abstract"
                        value={metadata.abstract}
                        onChange={handleMetadataChange}
                        rows={3}
                        className="form-textarea"
                        placeholder="Enter abstract if not in document"
                      ></textarea>
                    </div>
                    
                    <div>
                      <label htmlFor="keywords" className="form-label">Keywords (comma separated)</label>
                      <input
                        type="text"
                        id="keywords"
                        name="keywords"
                        value={metadata.keywords}
                        onChange={handleMetadataChange}
                        className="form-input"
                        placeholder="e.g., machine learning, artificial intelligence"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={!file || structurePaperMutation.isPending}
                    className={`btn btn-primary w-full ${
                      !file || structurePaperMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {structurePaperMutation.isPending ? (
                      <span className="flex items-center justify-center">
                        <LoadingSpinner size="small" text="" />
                        <span className="ml-2">Formatting Paper...</span>
                      </span>
                    ) : (
                      'Format Paper'
                    )}
                  </button>
                </div>

                {structurePaperMutation.isError && (
                  <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Error formatting paper</p>
                      <p className="text-sm mt-1">
                        {structurePaperMutation.error instanceof Error
                          ? structurePaperMutation.error.message
                          : 'An unexpected error occurred. Please try again.'}
                      </p>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <form onSubmit={handleManualSubmit} className="mt-6 space-y-6">
                <div>
                  <label htmlFor="manualTitle" className="form-label">Paper Title</label>
                  <input
                    type="text"
                    id="manualTitle"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="form-input"
                    placeholder="Enter paper title"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="manualAuthors" className="form-label">Authors (comma separated)</label>
                  <input
                    type="text"
                    id="manualAuthors"
                    value={manualAuthors}
                    onChange={(e) => setManualAuthors(e.target.value)}
                    className="form-input"
                    placeholder="e.g., John Smith, Jane Doe"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="manualAbstract" className="form-label">Abstract</label>
                  <textarea
                    id="manualAbstract"
                    value={manualAbstract}
                    onChange={(e) => setManualAbstract(e.target.value)}
                    rows={3}
                    className="form-textarea"
                    placeholder="Enter paper abstract"
                    required
                  ></textarea>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Paper Sections</h3>
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="btn btn-secondary text-sm py-1"
                    >
                      Add Section
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {manualSections.map((section, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                            className="form-input w-full mr-2"
                            placeholder="Section Title"
                            required
                          />
                          {manualSections.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSection(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <textarea
                          value={section.content}
                          onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                          rows={4}
                          className="form-textarea mt-2"
                          placeholder="Section Content"
                          required
                        ></textarea>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="manualReferences" className="form-label">References (one per line)</label>
                  <textarea
                    id="manualReferences"
                    value={manualReferences}
                    onChange={(e) => setManualReferences(e.target.value)}
                    rows={5}
                    className="form-textarea"
                    placeholder="Enter references, one per line"
                  ></textarea>
                </div>
                
                <FormatSelector value={manualFormat} onChange={setManualFormat} />

                <div className="mt-8">
                  <button
                    type="submit"
                    disabled={
                      !manualTitle || 
                      !manualAuthors || 
                      !manualAbstract || 
                      manualSections.some(s => !s.title || !s.content) ||
                      structurePaperFromTextMutation.isPending
                    }
                    className={`btn btn-primary w-full ${
                      !manualTitle || 
                      !manualAuthors || 
                      !manualAbstract || 
                      manualSections.some(s => !s.title || !s.content) ||
                      structurePaperFromTextMutation.isPending
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    {structurePaperFromTextMutation.isPending ? (
                      <span className="flex items-center justify-center">
                        <LoadingSpinner size="small" text="" />
                        <span className="ml-2">Formatting Paper...</span>
                      </span>
                    ) : (
                      'Format Paper'
                    )}
                  </button>
                </div>

                {structurePaperFromTextMutation.isError && (
                  <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Error formatting paper</p>
                      <p className="text-sm mt-1">
                        {structurePaperFromTextMutation.error instanceof Error
                          ? structurePaperFromTextMutation.error.message
                          : 'An unexpected error occurred. Please try again.'}
                      </p>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaperStructuringPage; 