import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '../../design-system/Button';
import './CommentForm.css';

interface CommentFormProps {
  onSubmit: (content: string) => void | Promise<void>;
  placeholder?: string;
  isReply?: boolean;
  onCancel?: () => void;
  disabled?: boolean;
}

/**
 * CommentForm Component
 * 
 * Input form for creating new comments or replies.
 * Features:
 * - Text input with character count
 * - Submit and cancel actions
 * - Async handling
 * - Validation (min 1, max 2000 chars)
 */
export const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  placeholder = 'Add a comment...',
  isReply = false,
  onCancel,
  disabled = false,
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charCount = content.length;
  const maxChars = 2000;
  const isValid = charCount > 0 && charCount <= maxChars;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(content);
      setContent('');
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    onCancel?.();
  };

  return (
    <form className={`comment-form ${isReply ? 'reply' : 'top-level'}`} onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        maxLength={maxChars}
        disabled={disabled || isSubmitting}
        className="comment-input"
        rows={isReply ? 2 : 3}
      />
      
      <div className="form-footer">
        <div className="char-count">
          <span className={charCount > maxChars * 0.9 ? 'warning' : ''}>
            {charCount}/{maxChars}
          </span>
        </div>
        
        <div className="form-actions">
          {isReply && onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="btn-cancel"
              disabled={isSubmitting}
            >
              <X size={14} />
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn-submit"
            disabled={!isValid || isSubmitting}
            title={!isValid ? 'Comment must be 1-2000 characters' : ''}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" />
                Sending...
              </>
            ) : (
              <>
                <Send size={14} />
                {isReply ? 'Reply' : 'Comment'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
