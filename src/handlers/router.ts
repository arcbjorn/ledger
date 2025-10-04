import http from 'node:http';
import { HTTP_METHOD, HTTP_STATUS, ERROR_MESSAGES } from '@constants';
import { respond } from '@utils/response';

type Handler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  params: Record<string, string>
) => Promise<void> | void;

interface Route {
  method: string;
  pattern: RegExp;
  handler: Handler;
  keys: string[];
}

class Router {
  private routes: Route[] = [];

  add(method: string, path: string, handler: Handler): void {
    const keys: string[] = [];

    // Convert path pattern to regex, extracting parameter names
    // Example: '/accounts/:id' -> /^\/accounts\/([^/]+)$/ with keys=['id']
    const pattern = new RegExp(
      '^' +
        path
          .replace(/\//g, '\\/')
          .replace(/:(\w+)/g, (_, key) => {
            keys.push(key);
            return '([^/]+)';
          }) +
        '$'
    );

    this.routes.push({ method, pattern, handler, keys });
  }

  get(path: string, handler: Handler): void {
    this.add(HTTP_METHOD.GET, path, handler);
  }

  post(path: string, handler: Handler): void {
    this.add(HTTP_METHOD.POST, path, handler);
  }

  delete(path: string, handler: Handler): void {
    this.add(HTTP_METHOD.DELETE, path, handler);
  }

  async handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const method = req.method || HTTP_METHOD.GET;
    const pathname = url.pathname;

    // Find matching route
    for (const route of this.routes) {
      if (route.method !== method) continue;

      const match = pathname.match(route.pattern);
      if (!match) continue;

      // Extract URL parameters from regex capture groups
      const params: Record<string, string> = {};
      route.keys.forEach((key, i) => {
        params[key] = match[i + 1] || '';
      });

      try {
        await route.handler(req, res, params);
        return;
      } catch (error) {
        console.error('Handler error:', error);
        respond(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR });
        return;
      }
    }

    // No route matched
    respond(res, HTTP_STATUS.NOT_FOUND, { error: ERROR_MESSAGES.NOT_FOUND });
  }
}

export const router = new Router();
export const handleRequest = router.handle.bind(router);
