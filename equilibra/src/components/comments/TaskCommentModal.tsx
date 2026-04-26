import React from 'react';
import { X } from 'lucide-react';
import type { TaskComment } from '../../models';
import { TaskCommentThread } from './TaskCommentThread';
import './TaskCommentModal.css';

interface TaskCommentModalProps {
  isOpen: boolean;
  taskId: string | number;
  taskTitle?: string;
  authorId: string | number;
  onClose: () => void;
}

/**
 * TaskCommentModal Component
 * 
 * Modal/sidebar wrapper for TaskCommentThread.
 * Displays task comments in a focused view.
 */
export const TaskCommentModal: React.FC<TaskCommentModalProps> = ({
  isOpen,
  taskId,
  taskTitle,
  authorId,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="comment-modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="comment-modal">
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Comments & Discussion</h2>
            {taskTitle && <p className="modal-subtitle">On: {taskTitle}</p>}
          </div>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          <TaskCommentThread
            taskId={taskId}
            authorId={authorId}
            onClose={onClose}
            isExpanded={true}
          />
        </div>
      </div>
    </>
  );
};
