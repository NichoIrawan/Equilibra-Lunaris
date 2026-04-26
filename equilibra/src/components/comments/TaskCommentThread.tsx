import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import { Button } from '../../design-system/Button';
import type { TaskComment, TaskCommentCreatePayload } from '../../models';
import { taskCommentService } from '../../services/taskCommentService';
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import './TaskCommentThread.css';

interface TaskCommentThreadProps {
  taskId: string | number;
  authorId: string | number;
  onClose?: () => void;
  isExpanded?: boolean; // Whether to show in modal/sidebar vs inline
}

/**
 * TaskCommentThread Component
 * 
 * Main component for displaying and managing task comments (threads).
 * Features:
 * - Display all comments and nested replies
 * - Create new top-level comments
 * - Reply to specific comments
 * - Edit/delete own comments
 * - Real-time updates
 */
export const TaskCommentThread: React.FC<TaskCommentThreadProps> = ({
  taskId,
  authorId,
  onClose,
  isExpanded = true,
}) => {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | number | null>(null);

  // Fetch comments when component mounts or taskId changes
  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedComments = await taskCommentService.getTaskComments(taskId);
      setComments(fetchedComments);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load comments'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (content: string) => {
    try {
      const payload: TaskCommentCreatePayload = {
        content,
        author_id: authorId,
        parent_comment_id: replyingTo || undefined,
      };

      const newComment = await taskCommentService.createTaskComment(
        taskId,
        payload,
      );

      if (replyingTo) {
        // Add reply to parent comment
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === replyingTo
              ? {
                  ...comment,
                  replies: [...(comment.replies || []), newComment],
                }
              : comment,
          ),
        );
        setReplyingTo(null);
      } else {
        // Add as top-level comment
        setComments((prevComments) => [newComment, ...prevComments]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create comment'
      );
    }
  };

  const handleUpdateComment = async (
    commentId: string | number,
    newContent: string,
  ) => {
    try {
      await taskCommentService.updateTaskComment(commentId, newContent);
      
      // Update in local state
      setComments((prevComments) =>
        prevComments.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, content: newContent, is_edited: true };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === commentId
                  ? { ...reply, content: newContent, is_edited: true }
                  : reply,
              ),
            };
          }
          return comment;
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update comment'
      );
    }
  };

  const handleDeleteComment = async (commentId: string | number) => {
    try {
      await taskCommentService.deleteTaskComment(commentId);

      // Remove from local state
      setComments((prevComments) =>
        prevComments
          .filter((comment) => comment.id !== commentId)
          .map((comment) => ({
            ...comment,
            replies: comment.replies?.filter((reply) => reply.id !== commentId),
          })),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete comment'
      );
    }
  };

  const containerClass = isExpanded
    ? 'task-comment-thread expanded'
    : 'task-comment-thread inline';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="thread-header">
        <div className="header-title">
          <MessageCircle size={16} />
          <span>Comments ({comments.length})</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="close-btn">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Comments List */}
      <div className="comments-container">
        {loading ? (
          <div className="loading-state">
            <Loader2 size={16} className="spinner" />
            <span>Loading comments...</span>
          </div>
        ) : comments.length === 0 ? (
          <div className="empty-state">
            <MessageCircle size={20} />
            <span>No comments yet. Start a discussion!</span>
          </div>
        ) : (
          <div className="comments-list">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={authorId}
                onReply={() => setReplyingTo(comment.id ?? null)}
                onUpdate={handleUpdateComment}
                onDelete={handleDeleteComment}
                onReplyDelete={handleDeleteComment}
                isReplyingTo={replyingTo === comment.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comment Form */}
      <CommentForm
        onSubmit={handleCreateComment}
        placeholder={
          replyingTo
            ? 'Reply to this comment...'
            : 'Add a comment about this task...'
        }
        isReply={Boolean(replyingTo)}
        onCancel={replyingTo ? () => setReplyingTo(null) : undefined}
      />
    </div>
  );
};
