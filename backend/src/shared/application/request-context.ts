import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  readonly requestId: string;
  readonly correlationId: string;
  readonly ipAddress: string;
  readonly userAgent: string | undefined;
  readonly userId?: string;
}

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export const requestContext = {
  run<T>(context: RequestContext, callback: () => T): T {
    return requestContextStorage.run(context, callback);
  },
  get(): RequestContext | undefined {
    return requestContextStorage.getStore();
  },
  setUserId(userId: string): void {
    const context = requestContextStorage.getStore();
    if (context) requestContextStorage.enterWith({ ...context, userId });
  },
};
