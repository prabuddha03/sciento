interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullPage?: boolean;
}

const LoadingSpinner = ({ 
  size = 'medium', 
  text = 'Loading...', 
  fullPage = false 
}: LoadingSpinnerProps) => {
  
  let sizeClasses = '';
  
  switch (size) {
    case 'small':
      sizeClasses = 'h-5 w-5 border-2';
      break;
    case 'large':
      sizeClasses = 'h-12 w-12 border-4';
      break;
    default:
      sizeClasses = 'h-8 w-8 border-3';
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeClasses} rounded-full border-gray-300 border-t-blue-600 animate-spin`}></div>
      {text && <p className="mt-2 text-gray-600">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner; 