import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, setToken } from './client'

// Auth
export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: async () => (await api.get('/me')).data })
}

export function useLogin() {
  return useMutation({
    mutationFn: async (creds) => (await api.post('/login', creds)).data,
    onSuccess: (data) => setToken(data.token),
  })
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => (await api.post('/logout')).data,
    onSettled: () => setToken(null),
  })
}

// Employees
export function useEmployees(params = {}) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: async () => (await api.get('/employees', { params })).data,
  })
}

function buildEmployeePayload(emp) {
  const hasFile = emp.profile_picture instanceof File
  if (!hasFile) {
    const { profile_picture, ...rest } = emp
    return { data: rest, headers: undefined }
  }
  const fd = new FormData()
  Object.entries(emp).forEach(([k, v]) => {
    if (k === 'id' || v === undefined || v === null) return
    if (k === 'profile_picture' && !(v instanceof File)) return
    if (typeof v === 'boolean') fd.append(k, v ? '1' : '0')
    else fd.append(k, v)
  })
  return { data: fd, headers: { 'Content-Type': 'multipart/form-data' } }
}

export function useSaveEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (emp) => {
      const { data, headers } = buildEmployeePayload(emp)
      if (emp.id) {
        if (data instanceof FormData) data.append('_method', 'PUT')
        const url = `/employees/${emp.id}`
        if (data instanceof FormData) return (await api.post(url, data, { headers })).data
        return (await api.put(url, data)).data
      }
      return (await api.post('/employees', data, { headers })).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/employees/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

// Sites
export function useSites(params = {}) {
  return useQuery({
    queryKey: ['sites', params],
    queryFn: async () => (await api.get('/sites', { params })).data,
  })
}

export function useSite(id, enabled = true) {
  return useQuery({
    queryKey: ['site', id],
    enabled: !!id && enabled,
    queryFn: async () => (await api.get(`/sites/${id}`)).data,
  })
}

export function useSaveSite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (site) => {
      if (site.id) return (await api.put(`/sites/${site.id}`, site)).data
      return (await api.post('/sites', site)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sites'] })
      qc.invalidateQueries({ queryKey: ['site'] })
    },
  })
}

export function useDeleteSite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/sites/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sites'] }),
  })
}

// Meal rules
export function useMealRules(params = {}) {
  return useQuery({
    queryKey: ['meal-rules', params],
    queryFn: async () => (await api.get('/meal-rules', { params })).data,
  })
}

export function useSaveMealRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (r) => {
      if (r.id) return (await api.put(`/meal-rules/${r.id}`, r)).data
      return (await api.post('/meal-rules', r)).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-rules'] }),
  })
}

export function useDeleteMealRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/meal-rules/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-rules'] }),
  })
}

// Users
export function useUsers(params = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => (await api.get('/users', { params })).data,
  })
}

export function useSaveUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (u) => {
      if (u.id) return (await api.put(`/users/${u.id}`, u)).data
      return (await api.post('/users', u)).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/users/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

// Cuisines
export function useCuisines(params = {}) {
  return useQuery({
    queryKey: ['cuisines', params],
    queryFn: async () => (await api.get('/cuisines', { params })).data,
  })
}

export function useSaveCuisine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c) => {
      if (c.id) return (await api.put(`/cuisines/${c.id}`, c)).data
      return (await api.post('/cuisines', c)).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuisines'] }),
  })
}

export function useDeleteCuisine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/cuisines/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuisines'] }),
  })
}

// Meal categories
export function useMealCategories(params = {}) {
  return useQuery({
    queryKey: ['meal-categories', params],
    queryFn: async () => (await api.get('/meal-categories', { params })).data,
  })
}

export function useSaveMealCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c) => {
      if (c.id) return (await api.put(`/meal-categories/${c.id}`, c)).data
      return (await api.post('/meal-categories', c)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal-categories'] })
      qc.invalidateQueries({ queryKey: ['cuisines'] })
    },
  })
}

export function useDeleteMealCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/meal-categories/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal-categories'] })
      qc.invalidateQueries({ queryKey: ['cuisines'] })
    },
  })
}

// Suppliers
export function useSuppliers(params = {}) {
  return useQuery({
    queryKey: ['suppliers', params],
    queryFn: async () => (await api.get('/suppliers', { params })).data,
  })
}

export function useSupplier(id, enabled = true) {
  return useQuery({
    queryKey: ['supplier', id],
    enabled: !!id && enabled,
    queryFn: async () => (await api.get(`/suppliers/${id}`)).data,
  })
}

export function useSaveSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (s) => {
      if (s.id) return (await api.put(`/suppliers/${s.id}`, s)).data
      return (await api.post('/suppliers', s)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      qc.invalidateQueries({ queryKey: ['supplier'] })
    },
  })
}

export function useDeleteSupplier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/suppliers/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  })
}

export function useUploadSupplierDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ supplierId, name, file, expires_at }) => {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('file', file)
      if (expires_at) fd.append('expires_at', expires_at)
      return (await api.post(`/suppliers/${supplierId}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data
    },
    onSuccess: (_, { supplierId }) => {
      qc.invalidateQueries({ queryKey: ['supplier', supplierId] })
    },
  })
}

export function useDeleteSupplierDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ supplierId, documentId }) =>
      (await api.delete(`/suppliers/${supplierId}/documents/${documentId}`)).data,
    onSuccess: (_, { supplierId }) => {
      qc.invalidateQueries({ queryKey: ['supplier', supplierId] })
    },
  })
}

// Supplier meal assignments
export function useSupplierMealAssignments(params = {}) {
  return useQuery({
    queryKey: ['supplier-meal-assignments', params],
    queryFn: async () => (await api.get('/supplier-meal-assignments', { params })).data,
  })
}

export function useSaveSupplierMealAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (a) => {
      if (a.id) return (await api.put(`/supplier-meal-assignments/${a.id}`, a)).data
      return (await api.post('/supplier-meal-assignments', a)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier-meal-assignments'] })
      qc.invalidateQueries({ queryKey: ['site'] })
    },
  })
}

export function useDeleteSupplierMealAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/supplier-meal-assignments/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['supplier-meal-assignments'] })
      qc.invalidateQueries({ queryKey: ['site'] })
    },
  })
}

// Distribution assignments
export function useDistributionAssignments(params = {}) {
  return useQuery({
    queryKey: ['distribution-assignments', params],
    queryFn: async () => (await api.get('/distribution-assignments', { params })).data,
  })
}

export function useSaveDistributionAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (a) => {
      if (a.id) return (await api.put(`/distribution-assignments/${a.id}`, a)).data
      return (await api.post('/distribution-assignments', a)).data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['distribution-assignments'] })
      qc.invalidateQueries({ queryKey: ['site'] })
    },
  })
}

export function useDeleteDistributionAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/distribution-assignments/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['distribution-assignments'] })
      qc.invalidateQueries({ queryKey: ['site'] })
    },
  })
}

// Food requests
export function useFoodRequests(params = {}) {
  return useQuery({
    queryKey: ['food-requests', params],
    queryFn: async () => (await api.get('/food-requests', { params })).data,
  })
}

export function useSaveFoodRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (r) => {
      if (r.id) return (await api.put(`/food-requests/${r.id}`, r)).data
      return (await api.post('/food-requests', r)).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food-requests'] }),
  })
}

export function useDeleteFoodRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/food-requests/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food-requests'] }),
  })
}

// Delivery notes
export function useDeliveryNotes(params = {}) {
  return useQuery({
    queryKey: ['delivery-notes', params],
    queryFn: async () => (await api.get('/delivery-notes', { params })).data,
  })
}

function buildDeliveryNotePayload(n) {
  const hasFile = n.attachment instanceof File
  if (!hasFile) {
    const { attachment, ...rest } = n
    return { data: rest, headers: undefined }
  }
  const fd = new FormData()
  Object.entries(n).forEach(([k, v]) => {
    if (k === 'id' || v === undefined || v === null || v === '') return
    if (k === 'attachment' && !(v instanceof File)) return
    fd.append(k, v)
  })
  return { data: fd, headers: { 'Content-Type': 'multipart/form-data' } }
}

export function useSaveDeliveryNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (n) => {
      const { data, headers } = buildDeliveryNotePayload(n)
      if (n.id) {
        if (data instanceof FormData) data.append('_method', 'PUT')
        const url = `/delivery-notes/${n.id}`
        if (data instanceof FormData) return (await api.post(url, data, { headers })).data
        return (await api.put(url, data)).data
      }
      return (await api.post('/delivery-notes', data, { headers })).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['delivery-notes'] }),
  })
}

export function useDeleteDeliveryNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/delivery-notes/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['delivery-notes'] }),
  })
}

// Complaints
export function useComplaints(params = {}) {
  return useQuery({
    queryKey: ['complaints', params],
    queryFn: async () => (await api.get('/complaints', { params })).data,
  })
}

function buildComplaintPayload(c) {
  const hasFile = c.attachment instanceof File
  if (!hasFile) {
    const { attachment, ...rest } = c
    return { data: rest, headers: undefined }
  }
  const fd = new FormData()
  Object.entries(c).forEach(([k, v]) => {
    if (k === 'id' || v === undefined || v === null || v === '') return
    if (k === 'attachment' && !(v instanceof File)) return
    fd.append(k, v)
  })
  return { data: fd, headers: { 'Content-Type': 'multipart/form-data' } }
}

export function useSaveComplaint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (c) => {
      const { data, headers } = buildComplaintPayload(c)
      if (c.id) {
        if (data instanceof FormData) data.append('_method', 'PUT')
        const url = `/complaints/${c.id}`
        if (data instanceof FormData) return (await api.post(url, data, { headers })).data
        return (await api.put(url, data)).data
      }
      return (await api.post('/complaints', data, { headers })).data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complaints'] }),
  })
}

export function useDeleteComplaint() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/complaints/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complaints'] }),
  })
}

// Logs
export function useLogs(params = {}) {
  return useQuery({
    queryKey: ['logs', params],
    queryFn: async () => (await api.get('/logs', { params })).data,
  })
}

// Settings
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data,
    staleTime: 60_000,
  })
}

export function usePublicSettings() {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => (await api.get('/public/settings')).data,
    staleTime: 60_000,
  })
}

export function useSaveSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => (await api.put('/settings', payload)).data,
    onSuccess: (data) => qc.setQueryData(['settings'], data),
  })
}

export function useUploadLogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file) => {
      const fd = new FormData()
      fd.append('logo', file)
      return (await api.post('/settings/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data
    },
    onSuccess: (data) => qc.setQueryData(['settings'], data),
  })
}

export function useDeleteLogo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.delete('/settings/logo')).data,
    onSuccess: (data) => qc.setQueryData(['settings'], data),
  })
}

// Roles & Permissions
export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => (await api.get('/permissions')).data,
    staleTime: 5 * 60_000,
  })
}

export function useRoles(params = {}) {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: async () => (await api.get('/roles', { params })).data,
  })
}

export function useRole(id, enabled = true) {
  return useQuery({
    queryKey: ['role', id],
    enabled: !!id && enabled,
    queryFn: async () => (await api.get(`/roles/${id}`)).data,
  })
}

export function useSaveRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (r) => {
      if (r.id) return (await api.put(`/roles/${r.id}`, r)).data
      return (await api.post('/roles', r)).data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      if (data?.id) qc.setQueryData(['role', data.id], data)
    },
  })
}

export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/roles/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  })
}

// Profile / password
export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => (await api.patch('/me/profile', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (payload) => (await api.post('/me/password', payload)).data,
  })
}
