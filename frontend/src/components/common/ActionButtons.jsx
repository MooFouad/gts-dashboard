import React, { useState } from 'react';
import { Edit2, Trash2, Paperclip } from 'lucide-react';
import AttachmentsDialog from './AttachmentsDialog';

const ActionButtons = ({ onEdit, onDelete, attachments = [] }) => {
  const [showAttachments, setShowAttachments] = useState(false);

  if (!onEdit && !onDelete) {
    return (
      <div className="text-xs text-slate-400 italic">
        Read Only
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-0.5">
        {onEdit && (
          <button
            onClick={onEdit}
            className="btn-icon !p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
            title="Edit"
          >
            <Edit2 size={15} />
          </button>
        )}
        <button
          onClick={() => setShowAttachments(true)}
          className={`btn-icon !p-1.5 ${
            attachments?.length > 0
              ? 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'
              : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
          }`}
          title={`Attachments (${attachments?.length || 0})`}
        >
          <Paperclip size={15} />
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="btn-icon !p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        )}
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
