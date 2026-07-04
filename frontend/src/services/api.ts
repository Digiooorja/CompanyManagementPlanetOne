import { authStorage } from '../utils/authStorage';

const API_BASE_URL = '/api';

// Helper function for making API requests
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = authStorage.getToken();
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(url, {
    ...defaultOptions,
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function apiUpload<T>(endpoint: string, formData: FormData): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = authStorage.getToken();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API Error ${url}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Projects API
export const projectsApi = {
  getAll: () => apiCall<any[]>('/projects'),
  getByBlockId: (blockId: number) => apiCall<any[]>(`/projects?blockId=${blockId}`),
  getById: (id: number) => apiCall<any>(`/projects/${id}`),
  create: (data: any) => apiCall('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/projects/${id}`, { method: 'DELETE' }),
};

// Activities API
export const activitiesApi = {
  getAll: () => apiCall<any[]>('/activities'),
  getByProjectId: (projectId: number) => apiCall<any[]>(`/activities?projectId=${projectId}`),
  getById: (id: number) => apiCall<any>(`/activities/${id}`),
  create: (data: any) => apiCall('/activities', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/activities/${id}`, { method: 'DELETE' }),
  getSubActivities: (id: number) => apiCall<any[]>(`/activities/${id}/sub-activities`),
  createSubActivity: (parentId: number, data: any) => apiCall('/activities', { 
    method: 'POST', 
    body: JSON.stringify({ ...data, parentActivityId: parentId }) 
  }),
  bulkUpdate: (activities: any[]) => apiCall('/activities/bulk/update', { 
    method: 'POST', 
    body: JSON.stringify({ activities }) 
  }),
  updateOrder: (id: number, direction: 'up' | 'down') => apiCall(`/activities/${id}/order`, { 
    method: 'PUT', 
    body: JSON.stringify({ direction }) 
  }),
};

export const commentsApi = {
  getByActivityId: (activityId: number) => apiCall<any[]>(`/comments?activityId=${activityId}`),
  getByTaskId: (taskId: number) => apiCall<any[]>(`/comments?taskId=${taskId}`),
  create: (data: any) => apiCall('/comments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/comments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/comments/${id}`, { method: 'DELETE' }),
};

export const departmentsApi = {
  getAll: () => apiCall<any[]>('/departments'),
};

export const usersApi = {
  getAll: () => apiCall<any[]>('/auth/users'),
};

// Admin API for user management and system metrics
export const adminApi = {
  getUsers: () => apiCall<any[]>('/admin/users'),
  getUserById: (id: number) => apiCall<any>(`/admin/users/${id}`),
  createUser: (data: any) => apiCall<any>('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: number, data: any) => apiCall<any>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: number) => apiCall<any>(`/admin/users/${id}`, { method: 'DELETE' }),
  getUserHistory: (id: number) => apiCall<any[]>(`/admin/users/${id}/history`),
  getUserAllocations: (id: number) => apiCall<any>(`/admin/users/${id}/allocations`),
  uploadUserPhoto: (id: number, formData: FormData) => apiUpload<{ photoUrl: string }>(`/admin/users/${id}/photo`, formData),
  getDashboard: () => apiCall<any>('/admin/dashboard')
};

// Org Chart API (Requirements §5.1) — auto-generated from reporting lines
export const orgChartApi = {
  getTree: () => apiCall<any[]>('/org-chart'),
};

// RBAC matrix API — Admin-only. This is the "configurable role/permission
// matrix" required by §4: Admin adjusts access here, not in route code.
export const rbacApi = {
  getRoles: () => apiCall<any[]>('/admin/roles'),
  createRole: (data: { name: string; description?: string }) =>
    apiCall<any>('/admin/roles', { method: 'POST', body: JSON.stringify(data) }),
  updateRole: (id: number, data: { description?: string }) =>
    apiCall<any>(`/admin/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRole: (id: number) => apiCall<any>(`/admin/roles/${id}`, { method: 'DELETE' }),
  getPermissions: () => apiCall<any[]>('/admin/permissions'),
  updateRolePermissions: (roleId: number, permissionKeys: string[]) =>
    apiCall<any>('/admin/role-permissions', { method: 'PUT', body: JSON.stringify({ roleId, permissionKeys }) }),
};


// Blocks API
export const blocksApi = {
  getAll: () => apiCall<any[]>('/blocks'),
  getById: (id: number) => apiCall<any>(`/blocks/${id}`),
  create: (data: any) => apiCall('/blocks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/blocks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/blocks/${id}`, { method: 'DELETE' }),
};

// Documents API
export const documentsApi = {
  getAll: () => apiCall<any[]>('/documents'),
  getByProjectId: (projectId: number) => apiCall<any[]>(`/documents?projectId=${projectId}`),
  getByActivityId: (activityId: number) => apiCall<any[]>(`/documents?activityId=${activityId}`),
  getByLicenceId: (licenceId: number) => apiCall<any[]>(`/documents?licenceId=${licenceId}`),
  getByTaskId: (taskId: number) => apiCall<any[]>(`/documents?taskId=${taskId}`),
  getById: (id: number) => apiCall<any>(`/documents/${id}`),
  getPresignedUrl: (id: number, type: 'download' | 'preview' = 'download') => apiCall<{ url: string; expiresIn: number }>(`/documents/${id}/presigned?type=${type}`),
  create: (data: any) => apiCall('/documents', { method: 'POST', body: JSON.stringify(data) }),
  upload: (formData: FormData) => apiUpload<any>('/documents', formData),
  uploadVersion: (documentId: number, formData: FormData) => apiUpload<any>(`/documents/${documentId}/versions`, formData),
  update: (id: number, data: any) => apiCall(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/documents/${id}`, { method: 'DELETE' }),
};

// Finance API
export const financeApi = {
  getAll: () => apiCall<any[]>('/finance'),
  getPending: () => apiCall<any[]>('/finance/pending'),
  getById: (id: number) => apiCall<any>(`/finance/${id}`),
  create: (data: any) => apiCall('/finance', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/finance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/finance/${id}`, { method: 'DELETE' }),
  delegate: (id: number, data: { delegateTo: string, comment?: string }) => apiCall(`/finance/${id}/delegate`, { method: 'PUT', body: JSON.stringify(data) }),
  approve: (id: number, data: { comment?: string }) => apiCall(`/finance/${id}/approve`, { method: 'PUT', body: JSON.stringify(data) }),
  reject: (id: number, data: { comment?: string }) => apiCall(`/finance/${id}/reject`, { method: 'PUT', body: JSON.stringify(data) }),
  createSupplement: (id: number, data: { additionalAmount: number; item?: string; category?: string }) =>
    apiCall(`/finance/${id}/create-supplement`, { method: 'POST', body: JSON.stringify(data) }),
  closeAfe: (id: number, data: { reconciliationConfirmed: boolean; comment?: string }) =>
    apiCall(`/finance/${id}/close`, { method: 'POST', body: JSON.stringify(data) }),
  nextAfe: (projectId?: number | string, activityId?: number | string) => {
    const qs: string[] = [];
    if (projectId !== undefined && projectId !== null && projectId !== '') qs.push(`projectId=${projectId}`);
    if (activityId !== undefined && activityId !== null && activityId !== '') qs.push(`activityId=${activityId}`);
    const q = qs.length ? `?${qs.join('&')}` : '';
    return apiCall<{ afeNumber: string; next: number }>(`/finance/next-afe${q}`);
  }
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { userId?: number | string; status?: string; module?: string; unreadOnly?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.userId !== undefined) qs.set('userId', String(params.userId));
    if (params?.status) qs.set('status', params.status);
    if (params?.module) qs.set('module', params.module);
    if (params?.unreadOnly) qs.set('unreadOnly', 'true');
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return apiCall<any[]>(`/notifications${q}`);
  },
  getById: (id: number) => apiCall<any>(`/notifications/${id}`),
  create: (data: any) => apiCall('/notifications', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/notifications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/notifications/${id}`, { method: 'DELETE' }),
  acknowledge: (id: number, comment?: string) =>
    apiCall(`/notifications/${id}/acknowledge`, { method: 'POST', body: JSON.stringify({ comment }) }),
  snooze: (id: number, reason?: string, snoozeUntil?: string) =>
    apiCall(`/notifications/${id}/snooze`, { method: 'POST', body: JSON.stringify({ reason, snoozeUntil }) }),
  runCheck: () => apiCall('/notifications/run-check', { method: 'POST' }),
};

// Notification Rules API (Admin-only — configures the shared alert engine, §10.4)
export const notificationRulesApi = {
  getAll: (module?: string) => apiCall<any[]>(`/notification-rules${module ? `?module=${module}` : ''}`),
  getById: (id: number) => apiCall<any>(`/notification-rules/${id}`),
  create: (data: any) => apiCall('/notification-rules', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/notification-rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/notification-rules/${id}`, { method: 'DELETE' }),
};

// Audit Log API (Admin-only — immutable governance record, §5.4)
export const auditApi = {
  getAll: (params?: Record<string, string | number>) => {
    const qs = new URLSearchParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
      }
    }
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return apiCall<{ data: any[]; total: number; page: number; pageSize: number }>(`/audit${q}`);
  },
  getById: (id: number) => apiCall<any>(`/audit/${id}`),
};


// Registers API
export const registersApi = {
  getAll: () => apiCall<any[]>('/registers'),
  getById: (id: number) => apiCall<any>(`/registers/${id}`),
  create: (data: any) => apiCall('/registers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/registers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/registers/${id}`, { method: 'DELETE' }),
};

// Reports API
export const reportsApi = {
  getAll: () => apiCall<any[]>('/reports'),
  getById: (id: number) => apiCall<any>(`/reports/${id}`),
  create: (data: any) => apiCall('/reports', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/reports/${id}`, { method: 'DELETE' }),
};
// Risks API
export const risksApi = {
  getAll: () => apiCall<any[]>('/risks'),
  getByProjectId: (projectId: number) => apiCall<any[]>(`/risks?projectId=${projectId}`),
  getById: (id: number) => apiCall<any>(`/risks/${id}`),
  create: (data: any) => apiCall('/risks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/risks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/risks/${id}`, { method: 'DELETE' }),
};
// Workflows API
export const workflowsApi = {
  getAll: () => apiCall<any[]>('/workflows'),
  getInbox: (department?: string) => apiCall<any[]>(`/workflows/inbox${department ? `?department=${encodeURIComponent(department)}` : ''}`),
  getById: (id: number) => apiCall<any>(`/workflows/${id}`),
  create: (data: any) => apiCall('/workflows', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/workflows/${id}`, { method: 'DELETE' }),
};

// Licences API
export const licencesApi = {
  getAll: () => apiCall<any[]>('/licences'),
  getById: (id: number) => apiCall<any>(`/licences/${id}`),
  create: (data: any) => apiCall('/licences', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/licences/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/licences/${id}`, { method: 'DELETE' }),
};

// Contracts API — Contract Register with expiry/renewal alerts (§5.11)
export const contractsApi = {
  getAll: (params?: { blockId?: number | string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.blockId !== undefined) qs.set('blockId', String(params.blockId));
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return apiCall<any[]>(`/contracts${q}`);
  },
  getById: (id: number) => apiCall<any>(`/contracts/${id}`),
  create: (data: any) => apiCall('/contracts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/contracts/${id}`, { method: 'DELETE' }),
};

// Compliance & Statutory Payments Tracker API (§5.7)
export const complianceApi = {
  getAll: (params?: { blockId?: number | string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.blockId !== undefined) qs.set('blockId', String(params.blockId));
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return apiCall<any[]>(`/compliance${q}`);
  },
  getById: (id: number) => apiCall<any>(`/compliance/${id}`),
  create: (data: any) => apiCall('/compliance', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/compliance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/compliance/${id}`, { method: 'DELETE' }),
};

// PC/GNPC Correspondence Log API (§5.14)
export const correspondenceApi = {
  getAll: (params?: { blockId?: number | string; direction?: string; awaitingResponse?: boolean; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.blockId !== undefined) qs.set('blockId', String(params.blockId));
    if (params?.direction) qs.set('direction', params.direction);
    if (params?.awaitingResponse !== undefined) qs.set('awaitingResponse', String(params.awaitingResponse));
    if (params?.search) qs.set('search', params.search);
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return apiCall<any[]>(`/correspondence${q}`);
  },
  getById: (id: number) => apiCall<any>(`/correspondence/${id}`),
  create: (data: any) => apiCall('/correspondence', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/correspondence/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/correspondence/${id}`, { method: 'DELETE' }),
};

// Decision Log API (§5.13)
export const decisionsApi = {
  getAll: (params?: { search?: string; decisionMaker?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.decisionMaker) qs.set('decisionMaker', params.decisionMaker);
    if (params?.status) qs.set('status', params.status);
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return apiCall<any[]>(`/decisions${q}`);
  },
  getById: (id: number) => apiCall<any>(`/decisions/${id}`),
  create: (data: any) => apiCall('/decisions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/decisions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/decisions/${id}`, { method: 'DELETE' }),
};

// Operations Update API (§5.12)
export const operationsUpdatesApi = {
  getAll: (params?: { blockId?: number | string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.blockId !== undefined) qs.set('blockId', String(params.blockId));
    if (params?.limit !== undefined) qs.set('limit', String(params.limit));
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return apiCall<any[]>(`/operations-updates${q}`);
  },
  getById: (id: number) => apiCall<any>(`/operations-updates/${id}`),
  create: (data: any) => apiCall('/operations-updates', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/operations-updates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/operations-updates/${id}`, { method: 'DELETE' }),
};

// Work Programme & Budget Tracker API (§5.6)
export const budgetLinesApi = {
  getAll: (params?: { blockId?: number | string; status?: string; currency?: string; activityId?: number | string }) => {
    const qs = new URLSearchParams();
    if (params?.blockId !== undefined) qs.set('blockId', String(params.blockId));
    if (params?.status) qs.set('status', params.status);
    if (params?.currency) qs.set('currency', params.currency);
    if (params?.activityId !== undefined) qs.set('activityId', String(params.activityId));
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return apiCall<any[]>(`/budget-lines${q}`);
  },
  getSummary: () => apiCall<any[]>('/budget-lines/summary'),
  getById: (id: number) => apiCall<any>(`/budget-lines/${id}`),
  create: (data: any) => apiCall('/budget-lines', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/budget-lines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/budget-lines/${id}`, { method: 'DELETE' }),
  requestRevision: (id: number, proposedApprovedBudget: number, comment?: string) =>
    apiCall(`/budget-lines/${id}/request-revision`, { method: 'POST', body: JSON.stringify({ proposedApprovedBudget, comment }) }),
  approveRevision: (id: number, comment?: string) =>
    apiCall(`/budget-lines/${id}/approve-revision`, { method: 'POST', body: JSON.stringify({ comment }) }),
  rejectRevision: (id: number, comment?: string) =>
    apiCall(`/budget-lines/${id}/reject-revision`, { method: 'POST', body: JSON.stringify({ comment }) }),
};

// Tasks API
export const tasksApi = {
  getAll: () => apiCall<any[]>('/tasks'),
  getMyTasks: () => apiCall<any[]>('/tasks/my'),
  getAssignedByMe: () => apiCall<any[]>('/tasks/assigned-by-me'),
  getById: (id: number) => apiCall<any>(`/tasks/${id}`),
  getSubtasks: (id: number) => apiCall<any[]>(`/tasks/${id}/subtasks`),
  getHistory: (id: number) => apiCall<any[]>(`/tasks/${id}/history`),
  getWorkload: () => apiCall<any[]>('/tasks/workload'),
  create: (data: any) => apiCall('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/tasks/${id}`, { method: 'DELETE' }),
};
