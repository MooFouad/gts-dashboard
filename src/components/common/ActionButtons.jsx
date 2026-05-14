import React, { useState } from 'react';
import { Edit2, Trash2, Paperclip } from 'lucide-react';
import AttachmentsDialog from './AttachmentsDialog';

const ActionButtons = ({ onEdit, onDelete, attachments = [] }) => {
  const [showAttachments, setShowAttachments] = useState(false);

  return (
    <>
      <div className="flex gap-1 sm:gap-2">
        <button
          onClick={onEdit}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
          title="Edit"
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={() => setShowAttachments(true)}
          className={`p-2 rounded transition ${
            attachments?.length > 0 
              ? 'text-green-600 hover:bg-green-50' 
              : 'text-gray-400 hover:bg-gray-50'
          }`}
          title={`Attachments (${attachments?.length || 0})`}
        >
          <Paperclip size={18} />
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-red-600 hover:bg-red-50 rounded transition"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <AttachmentsDialog
        isOpen={showAttachments}
        onClose={() => setShowAttachments(false)}
        attachments={attachments}
      />
    </>
  );
};

export default ActionButtons;