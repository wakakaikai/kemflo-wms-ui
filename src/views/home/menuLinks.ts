import type { RouteRecordRaw } from 'vue-router';
import { translateRouteTitle } from '@/utils/i18n';
import { getNormalPath } from '@/utils/ruoyi';
import { isHttp } from '@/utils/validate';

export interface HomeMenuLink {
  path: string;
  title: string;
  icon?: string;
  query?: string;
}

const SKIP_PATH_PREFIXES = ['/redirect', '/401', '/404', '/login', '/register', '/social-callback'];

function shouldSkipPath(path: string) {
  return SKIP_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function flattenHomeMenuRoutes(routes: RouteRecordRaw[], basePath = ''): HomeMenuLink[] {
  const result: HomeMenuLink[] = [];

  for (const route of routes) {
    if (route.hidden) continue;

    const segment = route.path?.startsWith('/') ? route.path : `/${route.path ?? ''}`;
    const fullPath = isHttp(route.path) ? route.path : getNormalPath(`${basePath}${segment}`);

    if (shouldSkipPath(fullPath)) continue;

    const visibleChildren = route.children?.filter((child) => !child.hidden) ?? [];

    if (visibleChildren.length) {
      result.push(...flattenHomeMenuRoutes(visibleChildren, fullPath));
      continue;
    }

    if (route.meta?.title && fullPath && fullPath !== '/index') {
      try {
        result.push({
          path: fullPath,
          title: translateRouteTitle(String(route.meta.title)),
          icon: route.meta.icon as string | undefined,
          query: route.query as string | undefined
        });
      } catch {
        result.push({
          path: fullPath,
          title: String(route.meta.title),
          icon: route.meta.icon as string | undefined,
          query: route.query as string | undefined
        });
      }
    }
  }

  return result;
}

export function dedupeHomeMenuLinks(links: HomeMenuLink[]) {
  const unique = new Map<string, HomeMenuLink>();
  links.forEach((link) => {
    if (!unique.has(link.path)) {
      unique.set(link.path, link);
    }
  });
  return Array.from(unique.values());
}
