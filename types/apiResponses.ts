export interface StatsApiResponse {
  totalRequests: number;
  totalBytes: number;
  averageResponseTime: number;
  requestsByStatus: { DownstreamStatus: number; count: number }[];
  requestsByService: { ServiceName: string | undefined; count: number }[];
  requestsByClients: { ClientHost: string; count: number }[];
  requestsByPaths: { RequestPath: string; count: number }[];
  requestsByUserAgent: { 'Request_User-Agent': string; count: number }[];
}

export interface LogEntry {
  ClientAddr?: string;
  ClientHost: string;
  DownstreamContentSize: number;
  DownstreamStatus: number;
  Duration: number;
  RequestMethod: string;
  RequestPath?: string;
  RequestProtocol?: string;
  RetryAttempts: number;
  ServiceName?: string;
  StartUTC: string;
  TLSCipher?: string;
  TLSVersion?: string;
  'downstream_Content-Type'?: string;
  level?: string;
  msg?: string;
  'origin_Content-Type'?: string;
  'request_User-Agent'?: string;
  'request_X-Forwarded-Proto'?: string;
  'request_X-Real-Ip'?: string;
  time: string;
}
