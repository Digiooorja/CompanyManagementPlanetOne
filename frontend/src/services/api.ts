const API_BASE_URL = '/api';

// Helper function for making API requests
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
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
  const token = localStorage.getItem('token');

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
  getById: (id: number) => apiCall<any>(`/finance/${id}`),
  create: (data: any) => apiCall('/finance', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/finance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/finance/${id}`, { method: 'DELETE' }),
};

// Notifications API
export const notificationsApi = {
  getAll: () => apiCall<any[]>('/notifications'),
  getById: (id: number) => apiCall<any>(`/notifications/${id}`),
  create: (data: any) => apiCall('/notifications', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/notifications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/notifications/${id}`, { method: 'DELETE' }),
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
  getById: (id: number) => apiCall<any>(`/workflows/${id}`),
  create: (data: any) => apiCall('/workflows', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiCall(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiCall(`/workflows/${id}`, { method: 'DELETE' }),
};
