import React, { useState } from 'react';
import { MessageCircle, MoreVertical, Edit2, Trash2, Check, X } from 'lucide-react';
import type { TaskComment } from '../../models';
import './CommentItem.css';

interface CommentItemProps {
  comment: TaskComment;
  currentUserId: string | number;
  onReply: (commentId: string | number) => void;
  onUpdate: (commentId: string | number, newContent: string) => void;
  onDelete: (commentId: string | number) => void;
  onReplyDelete: (commentId: string | number) => void;
  isReplyingTo?: boolean;
}

/**
 * CommentItem Component
 * 
 * Displays a single comment with:
 * - Author info and timestamp
 * - Comment content
 * - Edit/delete actions (for own comments)
 * - Reply button
 * - Nested replies
 */
export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onReply,
  onUpdate,
  onDelete,
  onReplyDelete,
  isReplyingTo = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnComment = String(comment.author_id) === String(currentUserId);
  const createdAt = new Date(comment.created_at || '');
  const timeAgo = formatTimeAgo(createdAt);
  const authorName = comment.author?.display_name || `User ${comment.author_id}`;

  const handleSaveEdit = () => {
    if (editContent.trim() !== comment.content) {
      onUpdate(comment.id!, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleDeleteComment = async () => {
    if (window.confirm('Delete this comment?')) {
      setIsDeleting(true);
      try {
        onDelete(comment.id!);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="comment-item-wrapper">
      <div className={`comment-item ${isOwnComment ? 'own-comment' : ''}`}>
        {/* Comment Header */}
        <div className="comment-header">
          <div className="author-info">
            <div className="avatar">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div className="author-details">
              <span className="author-name">{authorName}</span>
              <span className="timestamp" title={createdAt.toLocaleString()}>
                {timeAgo}
                {comment.is_edited && <span className="edited-badge">(edited)</span>}
              </span>
            </div>
          </div>

          {isOwnComment && (
            <div className="comment-menu">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="menu-trigger"
                title="Options"
              >
                <MoreVertical size={14} />
              </button>

              {showMenu && (
                <div className="menu-dropdown">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="menu-item edit"
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteComment}
                    disabled={isDeleting}
                    className="menu-item delete"
                  >
                    <Trash2 size={12} />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <div className="comment-edit-form">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="edit-textarea"
              maxLength={2000}
              rows={3}
            />
            <div className="edit-actions">
              <button onClick={handleSaveEdit} className="btn-save">
                <Check size={12} />
                Save
              </button>
              <button onClick={() => setIsEditing(false)} className="btn-cancel">
                <X size={12} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="comment-content">{comment.content}</p>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="comment-actions">
            <button
              onClick={() => onReply(comment.id!)}
              className={`action-btn reply ${isReplyingTo ? 'active' : ''}`}
            >
              <MessageCircle size={12} />
              Reply
            </button>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies-container">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={() => onReply(comment.id!)}
              onUpdate={onUpdate}
              onDelete={onReplyDelete}
              onReplyDelete={onReplyDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}
