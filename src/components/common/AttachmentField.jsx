import React from 'react';
import { Paperclip, X, Eye } from 'lucide-react';

const AttachmentField = ({ attachments = [], onChange, preview = false }) => {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const fileObjects = files.map(file => {
      // Create a base64 URL for the file
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            name: file.name,
            size: file.size,
            type: file.type,
            url: reader.result,
            file: file
          });
        };
        reader.readAsDataURL(file);
      });
    });

    // Wait for all files to be processed
    Promise.all(fileObjects).then(newFiles => {
      onChange([...attachments, ...newFiles]);
    });
  };

  const handleRemove = (index) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    onChange(newAttachments);
  };

  const handlePreview = (url) => {
    if (url.startsWith('data:')) {
      // For base64 URLs, open in new window
      const win = window.open();
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>File Preview</title>
            <style>
              body { margin: 0; }
              .preview-container { 
                width: 100vw; 
                height: 100vh; 
                display: flex;
                justify-content: center;
                align-items: center;
                background: #f3f4f6;
              }
              img, iframe { 
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }
            </style>
          </head>
          <body>
            <div class="preview-container">
              ${url.startsWith('data:image/') 
                ? `<img src="${url}" alt="Preview" />`
                : `<iframe src="${url}" frameborder="0" style="width:100%;height:100vh;" allowfullscreen></iframe>`
              }
            </div>
          </body>
        </html>
      `);
    } else {
      // For blob URLs or regular URLs
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-2">
      {!preview && (
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50">
            <Paperclip size={16} />
            <span>Add Attachments</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />
          </label>
        </div>
      )}

      {attachments?.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h3 className="text-sm font-medium text-gray-700">
              Attachments ({attachments.length})
            </h3>
          </div>
          <div className="divide-y">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white">
                <div className="flex items-center space-x-3">
                  <Paperclip size={16} className="text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePreview(file.url)}
                    className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                  >
                    <Eye size={16} />
                  </button>
                  {!preview && (
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentField;