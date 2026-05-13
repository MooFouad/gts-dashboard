import React, { useRef } from 'react';
import { FileUp } from 'lucide-react';

const ImportButton = ({ onImport, label = "Import", accept = ".xlsx,.xls" }) => {
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await onImport(file);
      event.target.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />
      <button
        onClick={handleClick}
        className="btn-outline !text-xs"
      >
        <FileUp size={15} />
        {label}
      </button>
    </>
  );
};

export default ImportButton;
