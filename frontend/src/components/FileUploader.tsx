import { useState, useRef, ChangeEvent } from 'react';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
  maxSizeMB?: number;
  className?: string;
}

const FileUploader = ({ 
  onFileSelect, 
  accept = '.pdf', 
  label = 'Upload PDF', 
  maxSizeMB = 10,
  className = '',
}: FileUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);

    // Check file size
    if (file.size > maxSizeBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    // Check file type
    const fileType = file.type;
    if (accept === '.pdf' && fileType !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className={className}>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mb-3" />
        <p className="text-gray-700 mb-2 font-medium">{label}</p>
        <p className="text-gray-500 text-sm mb-2">Drag and drop a file here, or click to select</p>
        <p className="text-gray-400 text-xs">Max file size: {maxSizeMB}MB</p>
        
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
        />
      </div>

      {selectedFile && (
        <div className="mt-3 flex items-center p-2 bg-gray-50 rounded border border-gray-200">
          <DocumentArrowUpIcon className="w-5 h-5 text-gray-600 mr-2" />
          <span className="text-sm text-gray-700 truncate flex-1">{selectedFile.name}</span>
          <span className="text-xs text-gray-500">
            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </span>
        </div>
      )}
      
      {error && (
        <p className="form-error mt-2">{error}</p>
      )}
    </div>
  );
};

export default FileUploader; 