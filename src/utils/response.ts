import type http from 'node:http';
import { HTTP_STATUS, CONTENT_TYPE } from '@constants';

export function respond(
  res: http.ServerResponse,
  status: number,
  data?: unknown
): void {
  if (status === HTTP_STATUS.NO_CONTENT) {
    res.writeHead(status);
    res.end();
    return;
  }

  res.writeHead(status, CONTENT_TYPE.JSON);
  res.end(JSON.stringify(data));
}

export function sendJson(
  res: http.ServerResponse,
  status: number,
  data: unknown
): void {
  res.writeHead(status, CONTENT_TYPE.JSON);
  res.end(JSON.stringify(data, null, 2));
}
