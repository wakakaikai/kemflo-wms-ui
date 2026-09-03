import { defineStore } from 'pinia';
import router, { constantRoutes, dynamicRoutes } from '@/router';
import store from '@/store';
import { getRouters } from '@/api/menu';
import auth from '@/plugins/auth';
import { RouteRecordRaw } from 'vue-router';
import Layout from '@/layout/index.vue';
import ParentView from '@/components/ParentView/index.vue';
import InnerLink from '@/layout/components/InnerLink/index.vue';
import { ref } from 'vue';
import { createCustomNameComponent } from '@/utils/createCustomNameComponent';
import { ElNotification } from 'element-plus';

// 匹配views里面所有的.vue文件
const modules = import.meta.glob(['./../../views/**/*.vue', '!./../../views/automation/_jeecg_super_source/**/*.vue']);

const VIEW_PATH_ALIASES: Record<string, string> = {
  'mes/SfcFixedSfc/index': 'mes/sfcFixedSfc/index',
  'mes/SfcFixedSfc': 'mes/sfcFixedSfc/index'
};

let viewModuleMap: Map<string, () => Promise<unknown>> | null = null;

const normalizeViewKey = (view: string) =>
  view
    .trim()
    .replace(/^\/+/, '')
    .replace(/^views\//, '')
    .replace(/\.vue$/, '')
    .replace(/\/+$/, '');

const getViewModuleMap = () => {
  if (viewModuleMap) {
    return viewModuleMap;
  }
  viewModuleMap = new Map();
  for (const path in modules) {
    const normalizedPath = path.replace(/\\/g, '/');
    const viewsIndex = normalizedPath.indexOf('/views/');
    if (viewsIndex === -1) {
      continue;
    }
    const key = normalizedPath.substring(viewsIndex + 7).replace(/\.vue$/, '');
    viewModuleMap.set(key, modules[path]);
    viewModuleMap.set(key.toLowerCase(), modules[path]);
  }
  return viewModuleMap;
};

const buildViewCandidates = (view: string) => {
  const normalizedView = normalizeViewKey(view);
  const aliasedView = VIEW_PATH_ALIASES[normalizedView] ?? normalizedView;
  const keys = [aliasedView, normalizedView, `${aliasedView}/index`, `${normalizedView}/index`];
  return [...new Set(keys.flatMap((key) => [key, key.toLowerCase()]))];
};
export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<RouteRecordRaw[]>([]);
  const addRoutes = ref<RouteRecordRaw[]>([]);
  const defaultRoutes = ref<RouteRecordRaw[]>([]);
  const topbarRouters = ref<RouteRecordRaw[]>([]);
  const sidebarRouters = ref<RouteRecordRaw[]>([]);

  const getRoutes = (): RouteRecordRaw[] => {
    return routes.value as RouteRecordRaw[];
  };
  const getDefaultRoutes = (): RouteRecordRaw[] => {
    return defaultRoutes.value as RouteRecordRaw[];
  };
  const getSidebarRoutes = (): RouteRecordRaw[] => {
    return sidebarRouters.value as RouteRecordRaw[];
  };
  const getTopbarRoutes = (): RouteRecordRaw[] => {
    return topbarRouters.value as RouteRecordRaw[];
  };

  const setRoutes = (newRoutes: RouteRecordRaw[]): void => {
    addRoutes.value = newRoutes;
    routes.value = constantRoutes.concat(newRoutes);
  };
  const setDefaultRoutes = (routes: RouteRecordRaw[]): void => {
    defaultRoutes.value = constantRoutes.concat(routes);
  };
  const setTopbarRoutes = (routes: RouteRecordRaw[]): void => {
    topbarRouters.value = routes;
  };
  const setSidebarRouters = (routes: RouteRecordRaw[]): void => {
    sidebarRouters.value = routes;
  };
  const generateRoutes = async (): Promise<RouteRecordRaw[]> => {
    const res = await getRouters();
    const { data } = res;
    const sdata = JSON.parse(JSON.stringify(data));
    const rdata = JSON.parse(JSON.stringify(data));
    const defaultData = JSON.parse(JSON.stringify(data));
    const sidebarRoutes = filterAsyncRouter(sdata);
    const rewriteRoutes = filterAsyncRouter(rdata, undefined, true);
    const defaultRoutes = filterAsyncRouter(defaultData);
    const asyncRoutes = filterDynamicRoutes(dynamicRoutes);
    asyncRoutes.forEach((route) => {
      router.addRoute(route);
    });
    setRoutes(rewriteRoutes);
    setSidebarRouters(constantRoutes.concat(sidebarRoutes));
    setDefaultRoutes(sidebarRoutes);
    setTopbarRoutes(defaultRoutes);
    // 路由name重复检查
    duplicateRouteChecker(asyncRoutes, sidebarRoutes);
    return new Promise<RouteRecordRaw[]>((resolve) => resolve(rewriteRoutes));
  };

  /**
   * 遍历后台传来的路由字符串，转换为组件对象
   * @param asyncRouterMap 后台传来的路由字符串
   * @param lastRouter 上一级路由
   * @param type 是否是重写路由
   */
  const filterAsyncRouter = (asyncRouterMap: RouteRecordRaw[], lastRouter?: RouteRecordRaw, type = false): RouteRecordRaw[] => {
    return asyncRouterMap.filter((route) => {
      if (type && route.children) {
        route.children = filterChildren(route.children, undefined);
      }
      // Layout ParentView 组件特殊处理
      if (route.component?.toString() === 'Layout') {
        route.component = Layout;
      } else if (route.component?.toString() === 'ParentView') {
        route.component = ParentView;
      } else if (route.component?.toString() === 'InnerLink') {
        route.component = InnerLink;
      } else {
        const hasChildren = Boolean(route.children?.length);
        const inferredView = !hasChildren ? [lastRouter?.path, route.path].filter(Boolean).join('/').replace(/\/+/g, '/') : undefined;
        const view = route.component || inferredView;
        // 目录路由可以只有 children；叶子路由缺少 component 时则根据完整路由路径推导页面。
        if (view) {
          route.component = loadView(view, route.name as string);
        }
      }
      if (route.children != null && route.children && route.children.length) {
        route.children = filterAsyncRouter(route.children, route, type);
      } else {
        delete route.children;
        delete route.redirect;
      }
      return true;
    });
  };
  const filterChildren = (childrenMap: RouteRecordRaw[], lastRouter?: RouteRecordRaw): RouteRecordRaw[] => {
    let children: RouteRecordRaw[] = [];
    childrenMap.forEach((el) => {
      el.path = lastRouter ? lastRouter.path + '/' + el.path : el.path;
      if (el.children && el.children.length && el.component?.toString() === 'ParentView') {
        children = children.concat(filterChildren(el.children, el));
      } else {
        children.push(el);
      }
    });
    return children;
  };
  return {
    routes,
    topbarRouters,
    sidebarRouters,
    defaultRoutes,

    getRoutes,
    getDefaultRoutes,
    getSidebarRoutes,
    getTopbarRoutes,

    setRoutes,
    generateRoutes,
    setSidebarRouters
  };
});

// 动态路由遍历，验证是否具备权限
export const filterDynamicRoutes = (routes: RouteRecordRaw[]) => {
  const res: RouteRecordRaw[] = [];
  routes.forEach((route) => {
    if (route.permissions) {
      if (auth.hasPermiOr(route.permissions)) {
        res.push(route);
      }
    } else if (route.roles) {
      if (auth.hasRoleOr(route.roles)) {
        res.push(route);
      }
    }
  });
  return res;
};

export const loadView = (view: any, name: string) => {
  if (typeof view !== 'string' || !view.trim()) {
    console.error(`[router] 路由 ${name || '(未命名)'} 缺少组件路径`);
    return undefined;
  }

  const moduleMap = getViewModuleMap();
  for (const candidate of buildViewCandidates(view)) {
    const loader = moduleMap.get(candidate);
    if (loader) {
      return createCustomNameComponent(loader, { name });
    }
  }

  console.error(`[router] 路由 ${name || '(未命名)'} 的组件不存在: ${view}`);
  return undefined;
};

// 非setup
export const usePermissionStoreHook = () => {
  return usePermissionStore(store);
};

interface Route {
  name?: string | symbol;
  path: string;
  children?: Route[];
}

/**
 * 检查路由name是否重复
 * @param localRoutes 本地路由
 * @param routes 动态路由
 */
function duplicateRouteChecker(localRoutes: Route[], routes: Route[]) {
  // 展平
  function flatRoutes(routes: Route[]) {
    const res: Route[] = [];
    routes.forEach((route) => {
      if (route.children) {
        res.push(...flatRoutes(route.children));
      } else {
        res.push(route);
      }
    });
    return res;
  }

  const allRoutes = flatRoutes([...localRoutes, ...routes]);

  const nameList: string[] = [];
  allRoutes.forEach((route) => {
    const name = route.name.toString();
    if (name && nameList.includes(name)) {
      const message = `路由名称: [${name}] 重复, 会造成 404`;
      console.error(message);
      ElNotification({
        title: '路由名称重复',
        message,
        type: 'error'
      });
      return;
    }
    nameList.push(route.name.toString());
  });
}
