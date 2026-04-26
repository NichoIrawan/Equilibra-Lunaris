import { apiFetch } from "./apiClient";
import type { TaskComment, TaskCommentCreatePayload } from "../models";
import JSONBig from "json-bigint";

export const taskCommentService = {
  /**
   * Get all comments for a task (top-level + replies nested)
   */
  getTaskComments: async (taskId: string | number): Promise<TaskComment[]> => {
    return await apiFetch<TaskComment[]>(`/v1/task-comments/tasks/${taskId}/comments`);
  },

  /**
   * Get a single comment with its replies
   */
  getTaskComment: async (commentId: string | number): Promise<TaskComment> => {
    return await apiFetch<TaskComment>(`/v1/task-comments/${commentId}`);
  },

  /**
   * Create a new comment or reply on a task
   */
  createTaskComment: async (
    taskId: string | number,
    payload: TaskCommentCreatePayload,
  ): Promise<TaskComment> => {
    return await apiFetch<TaskComment>(
      `/v1/task-comments/tasks/${taskId}/comments`,
      {
        method: "POST",
        body: JSONBig.stringify(payload),
      },
    );
  },

  /**
   * Update a comment's content
   */
  updateTaskComment: async (
    commentId: string | number,
    content: string,
  ): Promise<TaskComment> => {
    return await apiFetch<TaskComment>(
      `/v1/task-comments/${commentId}`,
      {
        method: "PUT",
        body: JSONBig.stringify({ content }),
      },
    );
  },

  /**
   * Delete a comment (soft delete - marks as deleted)
   */
  deleteTaskComment: async (commentId: string | number): Promise<void> => {
    await apiFetch(`/v1/task-comments/${commentId}`, {
      method: "DELETE",
    });
  },

  /**
   * Get comment count for a task (for badges/indicators)
   */
  getTaskCommentCount: async (
    taskId: string | number,
  ): Promise<{ task_id: string | number; comment_count: number }> => {
    return await apiFetch<{ task_id: string | number; comment_count: number }>(
      `/v1/task-comments/tasks/${taskId}/comments/count`,
      {
        method: "POST",
      },
    );
  },
};
