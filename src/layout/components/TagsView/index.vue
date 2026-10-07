<template>
  <div id="tags-view-container" ref="containerRef" class="tags-view-container">
    <div ref="tagsWrapperRef" class="tags-view-wrapper">
      <router-link v-for="tag in visitedViews" :key="tag.path" :data-path="tag.path" :class="{ active: isActive(tag), 'has-icon': tagsIcon, 'is-overflow': overflowPaths.has(tag.path) }" :inert="overflowPaths.has(tag.path)" :aria-hidden="overflowPaths.has(tag.path) || undefined" :to="{ path: tag.path ? tag.path : '', query: tag.query, fullPath: tag.fullPath ? tag.fullPath : '' }" class="tags-view-item" :style="activeStyle(tag)" @click.middle="!isAffix(tag) ? closeSelectedTag(tag) : ''" @contextmenu.prevent="openMenu(tag, $event)">
        <svg-icon v-if="tagsIcon && tag.meta && tag.meta.icon && tag.meta.icon !== '#'" :icon-class="tag.meta.icon" />
        <span class="tags-view-item-title">{{ tag.title ? translateRouteTitle(String(tag.title)) : '' }}</span>
        <span v-if="!isAffix(tag)" @click.prevent.stop="closeSelectedTag(tag)">
          <close class="el-icon-close" style="width: 1em; height: 1em; vertical-align: middle" />
        </span>
      </router-link>
    </div>
    <el-dropdown v-if="overflowTags.length" trigger="click" placement="bottom-end" :max-height="320" popper-class="tags-overflow-dropdown" @command="selectOverflowTag">
      <button class="tags-more-button" type="button" aria-label="更多已打开的页签" title="更多已打开的页签" @click="closeMenu">
        <el-icon><MoreFilled /></el-icon>
      </button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="tag in overflowTags" :key="tag.path" :command="tag.path" @contextmenu.prevent="openMenu(tag, $event)">
            <span class="tags-overflow-title">{{ tag.title ? translateRouteTitle(String(tag.title)) : '' }}</span>
            <button v-if="!isAffix(tag)" class="tags-overflow-close" type="button" :aria-label="`关闭${tag.title ? translateRouteTitle(String(tag.title)) : '页签'}`" @click.stop="closeSelectedTag(tag)" @keydown.stop>
              <el-icon><Close /></el-icon>
            </button>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <ul v-show="visible" :style="{ left: left + 'px', top: top + 'px' }" class="contextmenu">
      <li @click="refreshSelectedTag(selectedTag)"><refresh-right style="width: 1em; height: 1em" /> 刷新页面</li>
      <li v-if="!isAffix(selectedTag)" @click="closeSelectedTag(selectedTag)"><close style="width: 1em; height: 1em" /> 关闭当前</li>
      <li @click="closeOthersTags"><circle-close style="width: 1em; height: 1em" /> 关闭其他</li>
      <li v-if="!isFirstView()" @click="closeLeftTags"><back style="width: 1em; height: 1em" /> 关闭左侧</li>
      <li v-if="!isLastView()" @click="closeRightTags"><right style="width: 1em; height: 1em" /> 关闭右侧</li>
      <li @click="closeAllTags(selectedTag)"><circle-close style="width: 1em; height: 1em" /> 全部关闭</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { fitTagIndexes } from './overflow';
import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router';
import { MoreFilled } from '@element-plus/icons-vue';
import { getNormalPath } from '@/utils/ruoyi';
import { useSettingsStore } from '@/store/modules/settings';
import { usePermissionStore } from '@/store/modules/permission';
import { useTagsViewStore } from '@/store/modules/tagsView';
import { translateRouteTitle } from '@/utils/i18n';

const visible = ref(false);
const top = ref(0);
const left = ref(0);
const selectedTag = ref<RouteLocationNormalized>();
const affixTags = ref<RouteLocationNormalized[]>([]);
const containerRef = ref<HTMLDivElement>();
const tagsWrapperRef = ref<HTMLDivElement>();
const visiblePaths = ref<Set<string>>(new Set());
let resizeObserver: ResizeObserver | undefined;
let layoutFrame = 0;

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const route = useRoute();
const router = useRouter();

const visitedViews = computed(() => useTagsViewStore().getVisitedViews());
const routes = computed(() => usePermissionStore().getRoutes());
const tagsIcon = computed(() => useSettingsStore().tagsIcon);
const overflowTags = computed(() => visitedViews.value.filter((tag) => !visiblePaths.value.has(tag.path)));
const overflowPaths = computed(() => new Set(overflowTags.value.map((tag) => tag.path)));

const updateOverflow = () => {
  if (!containerRef.value || !tagsWrapperRef.value) return;
  const tags = [...tagsWrapperRef.value.querySelectorAll<HTMLElement>('.tags-view-item')];
  const widths = tags.map((tag) => tag.offsetWidth + 5);
  const containerWidth = containerRef.value.clientWidth;
  // 左右留白 20px；发生溢出时为“更多”按钮额外预留 40px。
  const hasOverflow = widths.reduce((sum, width) => sum + width, 0) > containerWidth - 20;
  const indexes = fitTagIndexes(widths, containerWidth - 20 - (hasOverflow ? 40 : 0), visitedViews.value.findIndex(isActive));
  const paths = new Set(indexes.map((index) => visitedViews.value[index]?.path).filter(Boolean));
  if (paths.size !== visiblePaths.value.size || [...paths].some((path) => !visiblePaths.value.has(path))) visiblePaths.value = paths;
};
const scheduleOverflow = () => {
  cancelAnimationFrame(layoutFrame);
  layoutFrame = requestAnimationFrame(updateOverflow);
};
const observeTags = () => {
  resizeObserver?.disconnect();
  if (containerRef.value) resizeObserver?.observe(containerRef.value);
  tagsWrapperRef.value?.querySelectorAll('.tags-view-item').forEach((tag) => resizeObserver?.observe(tag));
  scheduleOverflow();
};
watch([visitedViews, tagsIcon], () => nextTick(observeTags), { deep: true });
const selectOverflowTag = (path: string) => {
  const tag = visitedViews.value.find((view) => view.path === path);
  if (tag) router.push({ path: tag.path, query: tag.query, hash: tag.hash });
};

watch(route, () => {
  addTags();
  moveToCurrentTag();
});
watch(visible, (value) => {
  if (value) {
    document.body.addEventListener('click', closeMenu);
  } else {
    document.body.removeEventListener('click', closeMenu);
  }
});

const isActive = (r: RouteLocationNormalized): boolean => {
  return r.path === route.path;
};
const activeStyle = (tag: RouteLocationNormalized) => {
  if (!isActive(tag)) return {};
  return {
    'background-color': 'var(--tags-view-active-bg)',
    'border-color': 'var(--tags-view-active-border-color)'
  };
};
const isAffix = (tag: RouteLocationNormalized) => {
  return tag?.meta && tag?.meta?.affix;
};
const isFirstView = () => {
  try {
    return selectedTag.value.fullPath === '/index' || selectedTag.value.fullPath === visitedViews.value[1].fullPath;
  } catch (err) {
    return false;
  }
};
const isLastView = () => {
  try {
    return selectedTag.value.fullPath === visitedViews.value[visitedViews.value.length - 1].fullPath;
  } catch (err) {
    return false;
  }
};
const filterAffixTags = (routes: RouteRecordRaw[], basePath = '') => {
  let tags: RouteLocationNormalized[] = [];

  routes.forEach((route) => {
    if (route.meta && route.meta.affix) {
      const tagPath = getNormalPath(basePath + '/' + route.path);
      tags.push({
        hash: '',
        matched: [],
        params: undefined,
        query: undefined,
        redirectedFrom: undefined,
        fullPath: tagPath,
        path: tagPath,
        name: route.name as string,
        meta: { ...route.meta }
      });
    }
    if (route.children) {
      const tempTags = filterAffixTags(route.children, route.path);
      if (tempTags.length >= 1) {
        tags = [...tags, ...tempTags];
      }
    }
  });
  return tags;
};
const initTags = () => {
  const res = filterAffixTags(routes.value);
  affixTags.value = res;
  for (const tag of res) {
    // Must have tag name
    if (tag.name) {
      useTagsViewStore().addVisitedView(tag);
    }
  }
};
const addTags = () => {
  const { name } = route;
  if (route.query.title) {
    route.meta.title = route.query.title as string;
  }
  if (name) {
    useTagsViewStore().addView(route as any);
  }
};
const moveToCurrentTag = () => {
  nextTick(() => {
    for (const r of visitedViews.value) {
      if (r.path === route.path) {
        // when query is different then update
        if (r.fullPath !== route.fullPath) {
          useTagsViewStore().updateVisitedView(route);
        }
      }
    }
    scheduleOverflow();
  });
};
const refreshSelectedTag = (view: RouteLocationNormalized) => {
  proxy?.$tab.refreshPage(view);
  if (route.meta.link) {
    useTagsViewStore().delIframeView(route);
  }
};
const closeSelectedTag = (view: RouteLocationNormalized) => {
  proxy?.$tab.closePage(view).then(({ visitedViews }: any) => {
    if (isActive(view)) {
      toLastView(visitedViews, view);
    }
  });
};
const closeRightTags = () => {
  proxy?.$tab.closeRightPage(selectedTag.value).then((visitedViews: RouteLocationNormalized[]) => {
    if (!visitedViews.find((i: RouteLocationNormalized) => i.fullPath === route.fullPath)) {
      toLastView(visitedViews);
    }
  });
};
const closeLeftTags = () => {
  proxy?.$tab.closeLeftPage(selectedTag.value).then((visitedViews: RouteLocationNormalized[]) => {
    if (!visitedViews.find((i: RouteLocationNormalized) => i.fullPath === route.fullPath)) {
      toLastView(visitedViews);
    }
  });
};
const closeOthersTags = () => {
  if (!selectedTag.value) return;
  router.push({ path: selectedTag.value.path || '/index', query: selectedTag.value.query, hash: selectedTag.value.hash }).catch(() => {});
  proxy?.$tab.closeOtherPage(selectedTag.value).then(() => {
    moveToCurrentTag();
  });
};
const closeAllTags = (view: RouteLocationNormalized) => {
  proxy?.$tab.closeAllPage().then(({ visitedViews }) => {
    if (affixTags.value.some((tag) => tag.path === route.path)) {
      return;
    }
    toLastView(visitedViews, view);
  });
};
const toLastView = (visitedViews: RouteLocationNormalized[], view?: RouteLocationNormalized) => {
  const latestView = visitedViews.slice(-1)[0];
  if (latestView) {
    router.push(latestView.fullPath as string);
  } else {
    // now the default is to redirect to the home page if there is no tags-view,
    // you can adjust it according to your needs.
    if (view?.name === 'Dashboard') {
      // to reload home page
      router.replace({ path: '/redirect' + view?.fullPath });
    } else {
      router.push('/');
    }
  }
};
const openMenu = (tag: RouteLocationNormalized, e: MouseEvent) => {
  const menuMinWidth = 105;
  const offsetLeft = proxy?.$el.getBoundingClientRect().left; // container margin left
  const offsetWidth = proxy?.$el.offsetWidth; // container width
  const maxLeft = offsetWidth - menuMinWidth; // left boundary
  const l = e.clientX - offsetLeft + 15; // 15: margin right

  if (l > maxLeft) {
    left.value = maxLeft;
  } else {
    left.value = l;
  }

  top.value = e.clientY;
  visible.value = true;
  selectedTag.value = tag;
};
const closeMenu = () => {
  visible.value = false;
};
onMounted(() => {
  resizeObserver = new ResizeObserver(scheduleOverflow);
  initTags();
  addTags();
  nextTick(observeTags);
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  cancelAnimationFrame(layoutFrame);
  document.body.removeEventListener('click', closeMenu);
});
</script>

<style lang="scss" scoped>
.tags-view-container {
  display: flex;
  height: 34px;
  width: 100%;
  background-color: var(--el-bg-color);
  border-top: none;
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: none;
  .tags-view-wrapper {
    display: flex;
    flex: 1;
    min-width: 0;
    position: relative;
    overflow: hidden;
    align-items: center;
    gap: 5px;
    padding: 0 5px 0 15px;
    .tags-view-item {
      display: inline-flex;
      align-items: center;
      flex: 0 0 auto;
      max-width: min(240px, 100%);
      box-sizing: border-box;
      position: relative;
      cursor: pointer;
      height: 26px;
      line-height: 25px;
      background-color: var(--el-bg-color);
      border: 1px solid var(--el-border-color-light);
      color: #495060;
      padding: 0 8px;
      font-size: 12px;
      border-radius: var(--app-radius-md);
      transition:
        box-shadow 0.2s ease,
        transform 0.2s ease,
        border-color 0.2s ease,
        color 0.2s ease;
      &:hover {
        color: var(--el-color-primary);
        border-color: var(--el-color-primary-light-5);
        box-shadow: var(--app-shadow-sm);
        transform: translateY(-1px);
      }
      &.is-overflow {
        position: absolute;
        left: 0;
        top: 0;
        visibility: hidden;
        pointer-events: none;
      }
      &.active {
        background-color: var(--tags-view-active-bg);
        color: #fff;
        border-color: var(--tags-view-active-border-color);
        &::before {
          content: '';
          background: rgba(255, 255, 255, 0.7);
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          position: relative;
          flex-shrink: 0;
          margin-right: 5px;
        }
      }
    }
  }
  .tags-view-item.active.has-icon::before {
    content: none !important;
  }
  .tags-view-item-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-left: 4px;
    margin-right: 3px;
  }
  .tags-more-button {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    width: 35px;
    margin-right: 5px;
    border: none;
    background: transparent;
    color: var(--el-text-color-regular);
    cursor: pointer;
    &:hover,
    &:focus-visible {
      color: var(--el-color-primary);
      background: var(--el-fill-color-light);
    }
  }
  .contextmenu {
    margin: 0;
    background: var(--el-bg-color);
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 5px 0;
    border-radius: var(--app-radius-md);
    font-size: 12px;
    font-weight: 400;
    box-shadow: var(--app-shadow-md);
    li {
      margin: 0;
      padding: 7px 16px;
      cursor: pointer;
      &:hover {
        background: var(--el-fill-color-light);
      }
    }
  }
}
</style>

<style lang="scss">
.tags-overflow-dropdown {
  .el-dropdown-menu__item {
    min-width: 180px;
    max-width: 320px;
    gap: 12px;
  }
  .tags-overflow-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tags-overflow-close {
    display: inline-flex;
    flex-shrink: 0;
    padding: 3px;
    border: none;
    border-radius: 50%;
    color: var(--el-text-color-secondary);
    background: transparent;
    cursor: pointer;
    &:hover,
    &:focus-visible {
      color: var(--el-color-danger);
      background: var(--el-fill-color);
    }
  }
}
//reset element css of el-icon-close
.tags-view-wrapper {
  .tags-view-item {
    .el-icon-close {
      width: 16px;
      height: 16px;
      vertical-align: 2px;
      border-radius: 50%;
      text-align: center;
      transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
      transform-origin: 100% 50%;
      &:before {
        transform: scale(0.6);
        display: inline-block;
        vertical-align: -3px;
      }
      &:hover {
        background-color: #b4bccc;
        color: #fff;
        width: 12px !important;
        height: 12px !important;
      }
    }
  }
}
</style>
