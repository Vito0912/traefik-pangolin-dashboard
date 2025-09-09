export interface StatsApiResponse {
  totalRequests: number;
  totalBytes: number;
  averageResponseTime: number;
  requestsByStatus: { DownstreamStatus: number; count: number }[];
  requestsByService: { ServiceName: string; count: number }[];
  requestsByClients: { ClientHost: string; count: number }[];
  requestsByPaths: { RequestPath: string; count: number }[];
  requestsByUserAgent: { 'Request_User-Agent': string; count: number }[];
}
