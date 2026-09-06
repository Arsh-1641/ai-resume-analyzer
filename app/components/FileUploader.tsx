import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 KB";

  const units = ["KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const size = bytes / Math.pow(1024, unitIndex + 1);

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function FileUploader({ onFileSelect }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];

    // Rejected files should not overwrite a valid selection with null.
    if (!file) return;

    setSelectedFile(file);
    onFileSelect?.(file);
  }, [onFileSelect]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    maxSize: 20 * 1024 * 1024
  });

  const file = selectedFile;

  const handleRemoveFile = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (file) {
      setSelectedFile(null);
      onFileSelect?.(null);
    }
  };

  return (
    <div className='w-full gradient-border'>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <div className="space-y-4 cursor-pointer">
          {file ? (
            <div className="uploader-selected-file" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center space-x-3">
                <img src="/images/pdf.png" alt="pdf" className="size-10" />
                <div>
                  <p className="text-sm text-gray-700 font-medium truncate max-w-xs">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatSize(file.size)}</p>
                </div>
              </div>
              <button type="button" className="p-2 cursor-pointer" onClick={handleRemoveFile}>
                <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                <img src="/icons/info.svg" className="size-20" alt="" />
              </div>
              <p className="text-lg text-gray-500">
                <span className="font-semibold">Click to Upload</span> Or drag and drop
              </p>
              <p className="text-lg text-gray-500">PDF (max 20 MB)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FileUploader
