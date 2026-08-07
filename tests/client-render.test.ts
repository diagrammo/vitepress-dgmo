import { describe, it, expect } from 'vitest';
import { setupDgmoRender } from '../src/client-render.js';

/**
 * The registry key is `remark-dgmo`'s published handshake — two separately
 * bundled files meet on a global because a host may concatenate them.
 *
 * These tests run under `environment: 'node'`, which is the point: VitePress
 * calls `enhanceApp` during SSR too, and a module that reached for the DOM there
 * would break the build rather than the page.
 */
const REGISTRY_KEY = '__dgmoReferenceRenderer';

type RegistryHost = { [REGISTRY_KEY]?: unknown };

describe('setupDgmoRender', () => {
  it('does nothing during SSR, where there is no document', async () => {
    expect(typeof document).toBe('undefined');
    setupDgmoRender();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect((globalThis as RegistryHost)[REGISTRY_KEY]).toBeUndefined();
  });

  it('is safe to call repeatedly, as a route change would', () => {
    expect(() => {
      setupDgmoRender();
      setupDgmoRender();
    }).not.toThrow();
  });
});
