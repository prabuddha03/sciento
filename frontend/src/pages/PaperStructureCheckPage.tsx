import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ExclamationTriangleIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import FileUploader from '../components/FileUploader';
import LoadingSpinner from '../components/LoadingSpinner';
import paperService from '../services/paperService';
import type { StructureCheckResponse } from '../services/paperService';

// Re-use or define format options
const PAPER_FORMATS = [
  { id: 'ieee', name: 'IEEE' },
  { id: 'acm', name: 'ACM' },
  { id: 'apa', name: 'APA' },
  { id: 'mla', name: 'MLA' },
  { id: 'chicago', name: 'Chicago' },
  { id: 'harvard', name: 'Harvard' }
];

// Re-use FormatSelector component (could be moved to components folder)
const FormatSelector = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) => {
  return (
    <div className="mt-6">
      <label className="form-label">Select Format to Check Against</label>
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

const PaperStructureCheckPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<string>('ieee'); // Default format
  const [checkResult, setCheckResult] = useState<StructureCheckResponse | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const checkStructureMutation = useMutation<StructureCheckResponse, Error, { file: File; format: string }>({ // Add types
    mutationFn: ({ file, format }) => paperService.checkPaperStructure(file, format),
    onSuccess: (data) => {
      if (data.success) {
        setCheckResult(data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        console.error("Structure check failed:", data.message);
        setCheckResult(null); // Clear previous results on failure
        // Optionally: Set an error state here to show a user-friendly message
      }
    },
    onError: (error) => {
       console.error("API Error during structure check:", error);
       setCheckResult(null); // Clear results on API error
       // Optionally: Set an error state here
    }
  });

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setCheckResult(null); // Clear results when new file selected
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file && format) {
      checkStructureMutation.mutate({ file, format });
    }
  };

  // --- PDF Download Function --- 
  const downloadStructureReport = async () => {
    if (!checkResult || !resultsRef.current) {
      console.error("Cannot download report: No results or results element not found.");
      return;
    }

    // Use html2canvas to capture the results div
    const canvas = await html2canvas(resultsRef.current, {
      scale: 2, // Improve resolution
      useCORS: true, // If there were external images (not applicable here)
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate PDF dimensions
    const pdf = new jsPDF({
      orientation: 'p', // portrait
      unit: 'px', // use pixels
      format: 'a4' // standard A4 size
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = imgProps.width;
    const imgHeight = imgProps.height;
    
    // Scale image to fit PDF width
    const ratio = pdfWidth / imgWidth;
    const scaledHeight = imgHeight * ratio;
    let position = 0;
    let heightLeft = scaledHeight;

    // Add image, potentially across multiple pages
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = position - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
      heightLeft -= pdfHeight;
    }

    // Save the PDF
    pdf.save(`structure_check_report_${checkResult.formatChecked}.pdf`);
  };
  // --- End PDF Download Function ---

  // Helper to render score with color
  const renderComplianceScore = (score: number) => {
    let color = 'text-green-600';
    let message = 'High Compliance';
    
    if (score < 40) {
      color = 'text-red-600';
      message = 'Low Compliance';
    } else if (score < 75) {
      color = 'text-yellow-600';
      message = 'Moderate Compliance';
    }
    
    return (
      <div className="flex items-center space-x-2">
        <span className={`text-3xl font-bold ${color}`}>{score}/100</span>
        <span className={`font-medium ${color}`}>{message}</span>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Paper Structure Check</h1>
        <p className="mt-2 text-gray-600">
          Check how well a paper adheres to a selected academic formatting standard.
        </p>
      </div>

      {checkResult ? (
        // --- Results Display ---
        <div ref={resultsRef}>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Structure Check Results</h2>
            <div className="flex space-x-3">
               <button 
                onClick={downloadStructureReport} 
                className="btn btn-secondary flex items-center"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-1.5" />
                Download Report
              </button>
               <button 
                onClick={() => setCheckResult(null)} 
                className="btn btn-secondary"
              >
                Check Another Paper
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Compliance with {checkResult.formatChecked.toUpperCase()} Standard
              </h3>
              {/* Display Detected Format if available and different */}
              {checkResult.detectedFormat && checkResult.detectedFormat !== "Unknown" && checkResult.detectedFormat.toLowerCase() !== checkResult.formatChecked.toLowerCase() && (
                <p className="text-sm text-orange-700 bg-orange-50 p-2 rounded mb-4">
                  Note: The paper appears to be closer to <span className="font-medium">{checkResult.detectedFormat}</span> format.
                </p>
              )}
              <div className="mb-6">
                {renderComplianceScore(checkResult.complianceScore)}
              </div>
              <div>
                 <h4 className="text-lg font-medium text-gray-900 mb-2">Justification:</h4>
                 <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                   { // Clean and format justification text
                     checkResult.justification
                       .replace(/---JUSTIFICATION_END---$/i, '').trim() // Remove potential end delimiter
                       .split('\n').map((line, index) => {
                         // Handle lines starting with * or -
                         if (line.trim().startsWith('*') || line.trim().startsWith('-')) {
                           // Render list items with **...** converted to semibold
                           return (
                             <p key={index} className="pl-4">
                               {line.split(/(\*\*.*?\*\*)/g).map((part, i) => 
                                 part.startsWith('**') && part.endsWith('**') 
                                   ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong> 
                                   : part
                               )}
                             </p>
                           );
                         } 
                         // Handle other lines, converting **...** to semibold
                         return (
                           <p key={index} className="my-1">
                              {line.split(/(\*\*.*?\*\*)/g).map((part, i) => 
                                part.startsWith('**') && part.endsWith('**') 
                                  ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong> 
                                  : part
                              )}
                           </p>
                         );
                       })
                   }
                 </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // --- Form Display ---
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <FileUploader
                onFileSelect={handleFileSelect}
                accept=".pdf" // Limit to PDF for now
                label="Upload Research Paper (PDF)"
              />
              
              <FormatSelector value={format} onChange={setFormat} />

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={!file || !format || checkStructureMutation.isPending}
                  className={`btn btn-primary w-full ${
                    !file || !format || checkStructureMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {checkStructureMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner size="small" text="" />
                      <span className="ml-2">Checking Structure...</span>
                    </span>
                  ) : (
                    'Check Paper Structure'
                  )}
                </button>
              </div>

              {checkStructureMutation.isError && (
                <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Error Checking Structure</p>
                    <p className="text-sm mt-1">
                      {checkStructureMutation.error instanceof Error
                        ? checkStructureMutation.error.message
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

export default PaperStructureCheckPage; 