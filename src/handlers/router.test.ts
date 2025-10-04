import { describe, it, expect, beforeEach } from 'vitest';
import http from 'node:http';
import { router } from './router';
import { HTTP_STATUS, HTTP_METHOD } from '@constants';

// Helper to create mock request
function createMockRequest(method: string, url: string, body?: string): http.IncomingMessage {
  const req = {
    method,
    url,
    headers: { host: 'localhost:5000' },
    on: (event: string, handler: Function) => {
      if (event === 'data' && body) {
        handler(body);
      }
      if (event === 'end') {
        handler();
      }
      return req;
    },
  } as unknown as http.IncomingMessage;

  return req;
}

// Helper to create mock response
function createMockResponse() {
  let statusCode = 0;
  let headers: Record<string, string> = {};
  let responseData = '';

  const res = {
    writeHead: (status: number, hdrs?: Record<string, string>) => {
      statusCode = status;
      if (hdrs) headers = hdrs;
    },
    end: (data?: string) => {
      if (data) responseData = data;
    },
    getStatus: () => statusCode,
    getHeaders: () => headers,
    getData: () => responseData,
  } as unknown as http.ServerResponse & {
    getStatus: () => number;
    getHeaders: () => Record<string, string>;
    getData: () => string;
  };

  return res;
}

describe('Router', () => {
  beforeEach(() => {
    // Clear all routes before each test
    router['routes'] = [];
  });

  describe('route registration', () => {
    it('should register GET route', () => {
      const handler = () => {};
      router.get('/test', handler);

      expect(router['routes']).toHaveLength(1);
      expect(router['routes'][0].method).toBe(HTTP_METHOD.GET);
      expect(router['routes'][0].handler).toBe(handler);
    });

    it('should register POST route', () => {
      const handler = () => {};
      router.post('/test', handler);

      expect(router['routes']).toHaveLength(1);
      expect(router['routes'][0].method).toBe(HTTP_METHOD.POST);
    });

    it('should register DELETE route', () => {
      const handler = () => {};
      router.delete('/test', handler);

      expect(router['routes']).toHaveLength(1);
      expect(router['routes'][0].method).toBe(HTTP_METHOD.DELETE);
    });

    it('should register multiple routes', () => {
      router.get('/route1', () => {});
      router.post('/route2', () => {});
      router.delete('/route3', () => {});

      expect(router['routes']).toHaveLength(3);
    });
  });

  describe('pattern matching', () => {
    it('should match static paths', async () => {
      let called = false;
      router.get('/accounts', () => {
        called = true;
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/accounts');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(called).toBe(true);
    });

    it('should match paths with single parameter', async () => {
      let capturedId = '';
      router.get('/accounts/:id', (_req, _res, params) => {
        capturedId = params.id;
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/accounts/test-123');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(capturedId).toBe('test-123');
    });

    it('should match paths with multiple parameters', async () => {
      let params: Record<string, string> = {};
      router.get('/users/:userId/posts/:postId', (_req, _res, p) => {
        params = p;
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/users/user-1/posts/post-2');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(params.userId).toBe('user-1');
      expect(params.postId).toBe('post-2');
    });

    it('should not match incorrect paths', async () => {
      let called = false;
      router.get('/accounts', () => {
        called = true;
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/transactions');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(called).toBe(false);
      expect(res.getStatus()).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should not match incorrect method', async () => {
      let called = false;
      router.get('/accounts', () => {
        called = true;
      });

      const req = createMockRequest(HTTP_METHOD.POST, '/accounts');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(called).toBe(false);
      expect(res.getStatus()).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should match exact parameter paths only', async () => {
      let called = false;
      router.get('/accounts/:id', () => {
        called = true;
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/accounts/123/extra');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(called).toBe(false);
      expect(res.getStatus()).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe('route handler execution', () => {
    it('should execute matched route handler', async () => {
      let executed = false;
      router.get('/test', () => {
        executed = true;
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/test');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(executed).toBe(true);
    });

    it('should pass request and response to handler', async () => {
      let receivedReq: any;
      let receivedRes: any;
      router.get('/test', (req, res) => {
        receivedReq = req;
        receivedRes = res;
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/test');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(receivedReq).toBe(req);
      expect(receivedRes).toBe(res);
    });

    it('should pass extracted parameters to handler', async () => {
      let receivedParams: Record<string, string> = {};
      router.get('/items/:category/:id', (_req, _res, params) => {
        receivedParams = params;
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/items/books/42');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(receivedParams).toEqual({
        category: 'books',
        id: '42',
      });
    });

    it('should handle async handlers', async () => {
      let executed = false;
      router.get('/async', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        executed = true;
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/async');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(executed).toBe(true);
    });

    it('should execute first matching route only', async () => {
      let route1Called = false;
      let route2Called = false;

      router.get('/test', () => {
        route1Called = true;
      });

      router.get('/test', () => {
        route2Called = true;
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/test');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(route1Called).toBe(true);
      expect(route2Called).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle synchronous errors in handlers', async () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};

      router.get('/error', () => {
        throw new Error('Handler error');
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/error');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(res.getStatus()).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      const data = JSON.parse(res.getData());
      expect(data.error).toBeDefined();

      console.error = originalError;
    });

    it('should handle async errors in handlers', async () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};

      router.get('/async-error', async () => {
        await Promise.resolve();
        throw new Error('Async error');
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/async-error');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(res.getStatus()).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);

      console.error = originalError;
    });

    it('should return 404 for non-existent routes', async () => {
      const req = createMockRequest(HTTP_METHOD.GET, '/non-existent');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(res.getStatus()).toBe(HTTP_STATUS.NOT_FOUND);
      const data = JSON.parse(res.getData());
      expect(data.error).toBeDefined();
    });
  });

  describe('parameter extraction', () => {
    it('should handle parameters with special characters', async () => {
      let capturedId = '';
      router.get('/items/:id', (_req, _res, params) => {
        capturedId = params.id;
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/items/test-id_123');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(capturedId).toBe('test-id_123');
    });

    it('should handle UUID parameters', async () => {
      let capturedId = '';
      router.get('/accounts/:id', (_req, _res, params) => {
        capturedId = params.id;
      });

      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const req = createMockRequest(HTTP_METHOD.GET, `/accounts/${uuid}`);
      const res = createMockResponse();

      await router.handle(req, res);

      expect(capturedId).toBe(uuid);
    });

    it('should provide empty params object when no parameters', async () => {
      let receivedParams: Record<string, string> | undefined;
      router.get('/test', (_req, _res, params) => {
        receivedParams = params;
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/test');
      const res = createMockResponse();

      await router.handle(req, res);

      expect(receivedParams).toEqual({});
    });
  });

  describe('edge cases', () => {
    it('should handle request without URL', async () => {
      const req = { method: HTTP_METHOD.GET, headers: { host: 'localhost' } } as http.IncomingMessage;
      const res = createMockResponse();

      await router.handle(req, res);

      expect(res.getStatus()).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should handle request without method', async () => {
      const req = { url: '/test', headers: { host: 'localhost' } } as http.IncomingMessage;
      const res = createMockResponse();

      router.get('/test', () => {});

      await router.handle(req, res);

      // Should default to GET
      expect(res.getStatus()).not.toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should handle trailing slashes', async () => {
      let called = false;
      router.get('/test', () => {
        called = true;
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/test/');
      const res = createMockResponse();

      await router.handle(req, res);

      // Trailing slash should not match
      expect(called).toBe(false);
    });

    it('should handle empty parameter values', async () => {
      let capturedId = '';
      router.get('/items/:id', (_req, _res, params) => {
        capturedId = params.id;
      });

      const req = createMockRequest(HTTP_METHOD.GET, '/items/');
      const res = createMockResponse();

      await router.handle(req, res);

      // Should not match empty parameter
      expect(res.getStatus()).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });
});
