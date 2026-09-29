export const queryKeys = {
  all: (resource: string) => [resource] as const,
  lists: (resource: string) => [resource, 'list'] as const,
  list: (resource: string, params: Record<string, unknown>) => [resource, 'list', params] as const,
  details: (resource: string) => [resource, 'detail'] as const,
  detail: (resource: string, id: string | number) => [resource, 'detail', id] as const
};
