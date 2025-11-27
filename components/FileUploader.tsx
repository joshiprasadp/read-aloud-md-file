import React, { useRef } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileUploaderProps {
  onFileUpload: (content: string, fileName: string) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.md')) {
      alert('Please upload a valid Markdown (.md) file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileUpload(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div 
      className="border-2 border-dashed border-gray-700 rounded-xl p-10 text-center hover:border-blue-500 hover:bg-gray-800 transition-colors cursor-pointer bg-gray-900 shadow-sm"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".md" 
        className="hidden" 
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-gray-800 rounded-full text-blue-500 border border-gray-700">
          <Upload size={32} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Upload Markdown File</h3>
          <p className="text-gray-400 text-sm mt-1">Click to browse or drag & drop your .md file here</p>
        </div>
      </div>
    </div>
  );
};