import { apiFetch } from "./apiClient";
import type { Task, Bucket } from "../models";
import JSONBig from "json-bigint";

export const taskService = {
  getTasksByProject: async (projectId: string | number): Promise<Task[]> => {
    const tasks = await apiFetch<Task[]>("/tasks");
    return tasks.filter((t) => String(t.project_id) === String(projectId));
  },

  getMyTasks: async (userId: number): Promise<Task[]> => {
    const tasks = await apiFetch<Task[]>("/tasks");
    return tasks.filter((t) => String(t.lead_assignee_id) === String(userId));
  },

  getCalendarTasks: async (
    projectId: string | number,
    startDate?: string,
    endDate?: string,
  ): Promise<any> => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const queryString = params.toString();
    const url = `/v1/tasks/calendar/${projectId}${queryString ? `?${queryString}` : ""}`;
    return await apiFetch<any>(url);
  },

  createTask: async (data: Task): Promise<Task> => {
    return await apiFetch<Task>("/tasks", {
      method: "POST",
      body: JSONBig.stringify(data),
    });
  },

  updateTask: async (
    id: number | string,
    data: Partial<Task>,
  ): Promise<Task> => {
    return await apiFetch<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSONBig.stringify(data),
    });
  },

  updateTaskStatus: async (
    id: number | string,
    status: string,
  ): Promise<Task> => {
    return await apiFetch<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSONBig.stringify({ status }),
    });
  },

  deleteTask: async (id: number | string): Promise<void> => {
    await apiFetch(`/tasks/${id}`, {
      method: "DELETE",
    });
  },

  reorderTasks: async (
    projectId: string | number,
    bucketId: number | string,
    taskIds: (number | string)[],
  ): Promise<{
    status: string;
    order: (number | string)[];
    bucket_id: number | string;
  }> => {
    return await apiFetch(
      `/projects/${projectId}/buckets/${bucketId}/tasks/reorder`,
      {
        method: "PUT",
        body: JSONBig.stringify(taskIds),
      },
    );
  },

  getBuckets: async (projectId: number | string): Promise<Bucket[]> => {
    return await apiFetch<Bucket[]>(`/projects/${projectId}/buckets`);
  },
};
