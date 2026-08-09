<template>
  <div class="home">
    <section class="hero">
      <div class="hero-shell">
        <div class="hero-brand-block">
          <img :src="logoUrl" :alt="MSG.brandAlt" class="hero-logo" />
          <div class="hero-brand-copy">
            <p class="hero-brand-name">{{ appTitle }}</p>
            <p class="hero-brand-en">KEMFLO MANUFACTURING PLATFORM</p>
            <h1 class="hero-title">{{ MSG.heroTitle }}</h1>
            <p class="hero-lead">{{ MSG.heroLead }}</p>
          </div>
        </div>

        <div class="hero-side">
          <div class="hero-cta-row">
            <button
              type="button"
              class="cta cta--wms"
              :disabled="!wmsPortal?.links.length"
              @click="enterPortal(wmsPortal)"
            >
              <span class="cta-icon">
                <svg-icon icon-class="shopping" />
              </span>
              <span class="cta-copy">
                <span class="cta-label">{{ MSG.ctaWmsLabel }}</span>
                <strong>{{ MSG.ctaWmsAction }}</strong>
              </span>
              <el-icon class="cta-arrow"><ArrowRight /></el-icon>
            </button>
            <button
              type="button"
              class="cta cta--mes"
              :disabled="!mesPortal?.links.length"
              @click="enterPortal(mesPortal)"
            >
              <span class="cta-icon">
                <svg-icon icon-class="build" />
              </span>
              <span class="cta-copy">
                <span class="cta-label">{{ MSG.ctaMesLabel }}</span>
                <strong>{{ MSG.ctaMesAction }}</strong>
              </span>
              <el-icon class="cta-arrow"><ArrowRight /></el-icon>
            </button>
          </div>

          <div class="hero-meta">
            <span class="meta-chip">{{ displayName }}</span>
            <span class="meta-sep" />
            <home-clock class="meta-clock" />
            <span class="meta-sep" />
            <span class="meta-ver">v{{ appVersion }}</span>
          </div>
        </div>
      </div>
    </section>

    <main class="main">
      <home-notice-panel />

      <section v-if="linksReady" class="block">
        <header class="block-head">
          <div class="block-title-row">
            <span class="block-index">01</span>
            <h2>{{ MSG.coreBusiness }}</h2>
          </div>
          <p>{{ MSG.coreBusinessDesc }}</p>
        </header>

        <div class="gateway">
          <article
            v-for="portal in primaryPortals"
            :key="portal.key"
            class="gateway-panel"
            :class="portal.theme"
          >
            <div class="gateway-glow" aria-hidden="true" />
            <div class="gateway-head">
              <div class="gateway-mark">
                <svg-icon :icon-class="portal.icon" />
              </div>
              <div class="gateway-copy">
                <h3>{{ portal.title }}</h3>
                <p>{{ portal.subtitle }}</p>
              </div>
              <button
                v-if="portal.links.length"
                type="button"
                class="gateway-go"
                @click="goTo(portal.links[0])"
              >
                {{ MSG.enterModule }}
                <el-icon><ArrowRight /></el-icon>
              </button>
            </div>

            <div v-if="portal.links.length" class="gateway-links">
              <button
                v-for="(link, idx) in portal.links.slice(0, portal.maxLinks)"
                :key="link.path"
                type="button"
                class="gateway-link"
                :style="{ '--i': idx }"
                @click="goTo(link)"
              >
                <svg-icon v-if="link.icon" :icon-class="link.icon" />
                <span>{{ link.title }}</span>
              </button>
            </div>
            <el-empty v-else :image-size="48" :description="MSG.noMenu" />
          </article>
        </div>
      </section>

      <section v-else class="block block--loading">
        <el-skeleton :rows="6" animated />
      </section>

      <section v-if="linksReady && secondaryPortals.length" class="block">
        <header class="block-head">
          <div class="block-title-row">
            <span class="block-index">02</span>
            <h2>{{ MSG.support }}</h2>
          </div>
          <p>{{ MSG.supportDesc }}</p>
        </header>

        <div class="capability">
          <article
            v-for="(portal, idx) in secondaryPortals"
            :key="portal.key"
            class="capability-card"
            :class="portal.theme"
            :style="{ '--i': idx }"
          >
            <button type="button" class="capability-main" @click="enterPortal(portal)">
              <span class="capability-top">
                <span class="capability-icon">
                  <svg-icon :icon-class="portal.icon" />
                </span>
                <span class="capability-count">{{ portal.links.length }} {{ MSG.entryUnit }}</span>
              </span>
              <strong class="capability-title">{{ portal.title }}</strong>
              <span class="capability-desc">{{ portal.subtitle }}</span>
              <span class="capability-enter">
                {{ MSG.enterNow }}
                <el-icon><ArrowRight /></el-icon>
              </span>
            </button>

            <div v-if="portal.links.length" class="capability-links">
              <button
                v-for="link in portal.links.slice(0, 3)"
                :key="link.path"
                type="button"
                class="capability-link"
                @click="goTo(link)"
              >
                {{ link.title }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="linksReady" class="block">
        <div class="console">
          <div class="console-bar">
            <div>
              <div class="block-title-row">
                <span class="block-index">03</span>
                <h2>{{ MSG.catalog }}</h2>
              </div>
              <p class="console-hint">{{ filteredQuickLinks.length }} / {{ searchableLinks.length }} {{ MSG.catalogUnit }}</p>
            </div>
            <el-input
              v-model="linkKeyword"
              clearable
              :placeholder="MSG.searchPlaceholder"
              class="console-search"
              prefix-icon="Search"
            />
          </div>

          <div class="console-tabs" role="tablist">
            <button
              v-for="tab in catalogTabs"
              :key="tab.key"
              type="button"
              class="console-tab"
              :class="{ 'is-active': catalogTab === tab.key }"
              @click="catalogTab = tab.key"
            >
              {{ tab.label }}
              <em>{{ tab.count }}</em>
            </button>
          </div>

          <div v-if="filteredQuickLinks.length" class="console-list">
            <button
              v-for="(link, idx) in filteredQuickLinks"
              :key="link.path"
              type="button"
              class="console-row"
              :class="`tone-${resolveLinkTone(link.path)}`"
              :style="{ '--i': Math.min(idx, 12) }"
              @click="goTo(link)"
            >
              <span class="console-row-mark">
                <svg-icon v-if="link.icon" :icon-class="link.icon" />
                <span v-else class="console-row-fallback">{{ link.title.slice(0, 1) }}</span>
              </span>
              <span class="console-row-body">
                <strong>{{ link.title }}</strong>
                <small>
                  <span class="console-tag">{{ resolveLinkLabel(link.path) }}</span>
                  <span>{{ link.path }}</span>
                </small>
              </span>
              <el-icon class="console-row-arrow"><ArrowRight /></el-icon>
            </button>
          </div>
          <el-empty v-else :image-size="64" :description="MSG.noMatch" />
        </div>
      </section>
    </main>

    <footer class="footer">
      {{ MSG.footer }}
    </footer>
  </div>
</template>

<script setup lang="ts" name="Index">
import { ArrowRight } from '@element-plus/icons-vue';
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePermissionStore } from '@/store/modules/permission';
import { useUserStore } from '@/store/modules/user';
import { isHttp } from '@/utils/validate';
import HomeClock from '@/views/home/HomeClock.vue';
import HomeNoticePanel from '@/views/home/HomeNoticePanel.vue';
import { MSG } from '@/views/home/messages';
import { dedupeHomeMenuLinks, flattenHomeMenuRoutes, type HomeMenuLink } from '@/views/home/menuLinks';
import logoUrl from '@/assets/logo/kemflo-logo.jpg';

interface PortalDef {
  key: string;
  title: string;
  subtitle: string;
  theme: string;
  icon: string;
  matchers: RegExp[];
  maxLinks: number;
  primary?: boolean;
}

interface PortalView extends PortalDef {
  links: HomeMenuLink[];
}

const appTitle = import.meta.env.VITE_APP_TITLE || MSG.defaultAppTitle;
const appVersion = '5.4.0';

const router = useRouter();
const permissionStore = usePermissionStore();
const userStore = useUserStore();

const linksReady = ref(false);
const linkKeyword = ref('');
const catalogTab = ref<'all' | 'wms' | 'mes' | 'other'>('all');
const menuLinks = shallowRef<HomeMenuLink[]>([]);

const displayName = computed(() => userStore.nickname || userStore.name || MSG.defaultUser);

const resolveLinkTone = (path: string) => {
  if (/^\/wms(\/|$)/i.test(path)) return 'wms';
  if (/^\/mes(\/|$)/i.test(path)) return 'mes';
  if (/^\/scada(\/|$)/i.test(path)) return 'scada';
  if (/^\/report(\/|$)/i.test(path)) return 'report';
  if (/^\/iot(\/|$)/i.test(path)) return 'iot';
  if (/^\/automation(\/|$)/i.test(path)) return 'auto';
  return 'other';
};

const resolveLinkLabel = (path: string) => {
  const map: Record<string, string> = {
    wms: 'WMS',
    mes: 'MES',
    scada: MSG.toneScada,
    report: MSG.toneReport,
    iot: 'IoT',
    auto: MSG.toneAuto,
    other: MSG.toneOther
  };
  return map[resolveLinkTone(path)] || MSG.toneOther;
};

const portalDefs: PortalDef[] = [
  {
    key: 'wms',
    title: MSG.wmsTitle,
    subtitle: MSG.wmsSubtitle,
    theme: 'is-wms',
    icon: 'shopping',
    matchers: [/^\/wms(\/|$)/i],
    maxLinks: 8,
    primary: true
  },
  {
    key: 'mes',
    title: MSG.mesTitle,
    subtitle: MSG.mesSubtitle,
    theme: 'is-mes',
    icon: 'build',
    matchers: [/^\/mes(\/|$)/i],
    maxLinks: 8,
    primary: true
  },
  {
    key: 'scada',
    title: MSG.scadaTitle,
    subtitle: MSG.scadaSubtitle,
    theme: 'is-scada',
    icon: 'monitor',
    matchers: [/^\/scada(\/|$)/i],
    maxLinks: 6
  },
  {
    key: 'report',
    title: MSG.reportTitle,
    subtitle: MSG.reportSubtitle,
    theme: 'is-report',
    icon: 'chart',
    matchers: [/^\/report(\/|$)/i],
    maxLinks: 6
  },
  {
    key: 'iot',
    title: MSG.iotTitle,
    subtitle: MSG.iotSubtitle,
    theme: 'is-iot',
    icon: 'redis',
    matchers: [/^\/iot(\/|$)/i],
    maxLinks: 6
  },
  {
    key: 'automation',
    title: MSG.automationTitle,
    subtitle: MSG.automationSubtitle,
    theme: 'is-automation',
    icon: 'guide',
    matchers: [/^\/automation(\/|$)/i],
    maxLinks: 6
  }
];

const buildPortals = (defs: PortalDef[]): PortalView[] =>
  defs.map((def) => ({
    ...def,
    links: menuLinks.value.filter((link) => def.matchers.some((matcher) => matcher.test(link.path)))
  }));

const primaryPortals = computed(() => buildPortals(portalDefs.filter((item) => item.primary)));
const secondaryPortals = computed(() =>
  buildPortals(portalDefs.filter((item) => !item.primary)).filter((item) => item.links.length)
);
const wmsPortal = computed(() => primaryPortals.value.find((item) => item.key === 'wms'));
const mesPortal = computed(() => primaryPortals.value.find((item) => item.key === 'mes'));

const searchableLinks = computed(() => menuLinks.value.filter((link) => link.path !== '/index'));

const matchCatalogTab = (path: string, tab: typeof catalogTab.value) => {
  if (tab === 'all') return true;
  if (tab === 'wms') return /^\/wms(\/|$)/i.test(path);
  if (tab === 'mes') return /^\/mes(\/|$)/i.test(path);
  return !/^\/(wms|mes)(\/|$)/i.test(path);
};

const catalogTabs = computed(() => {
  const links = searchableLinks.value;
  return [
    { key: 'all' as const, label: MSG.tabAll, count: links.length },
    { key: 'wms' as const, label: 'WMS', count: links.filter((link) => matchCatalogTab(link.path, 'wms')).length },
    { key: 'mes' as const, label: 'MES', count: links.filter((link) => matchCatalogTab(link.path, 'mes')).length },
    { key: 'other' as const, label: MSG.toneOther, count: links.filter((link) => matchCatalogTab(link.path, 'other')).length }
  ];
});

const filteredQuickLinks = computed(() => {
  const keyword = linkKeyword.value.trim().toLowerCase();
  const list = searchableLinks.value.filter((link) => matchCatalogTab(link.path, catalogTab.value));
  const matched = keyword
    ? list.filter((link) => link.title.toLowerCase().includes(keyword) || link.path.toLowerCase().includes(keyword))
    : list;
  return matched.slice(0, keyword ? 40 : 24);
});

const rebuildMenuLinks = () => {
  try {
    const routes = permissionStore.getSidebarRoutes() || [];
    menuLinks.value = dedupeHomeMenuLinks(flattenHomeMenuRoutes(routes));
  } catch (error) {
    console.error(MSG.buildMenuFail, error);
    menuLinks.value = [];
  } finally {
    linksReady.value = true;
  }
};

const goTo = (link: HomeMenuLink) => {
  if (isHttp(link.path)) {
    window.open(link.path, '_blank');
    return;
  }
  if (link.query) {
    try {
      router.push({ path: link.path, query: JSON.parse(link.query) });
      return;
    } catch {
      // ignore invalid query
    }
  }
  router.push(link.path);
};

const enterPortal = (portal?: PortalView) => {
  if (!portal?.links.length) return;
  goTo(portal.links[0]);
};

onMounted(() => {
  nextTick(() => {
    requestAnimationFrame(() => rebuildMenuLinks());
  });
});

watch(
  () => permissionStore.sidebarRouters.length,
  () => {
    if (!linksReady.value) rebuildMenuLinks();
  }
);
</script>

<style scoped lang="scss">
.home {
  --ink: #13233a;
  --ink-soft: rgba(19, 35, 58, 0.62);
  --ink-faint: rgba(19, 35, 58, 0.42);
  --line: rgba(19, 35, 58, 0.1);
  --paper: #eef3f7;
  --panel: rgba(255, 255, 255, 0.92);
  --wms: #1d6fd8;
  --wms-soft: #e8f1fc;
  --mes: #0d8a68;
  --mes-soft: #e6f6f0;
  --scada: #c27a12;
  --report: #4b5d73;
  --iot: #0b8fa8;
  --auto: #1f7a74;
  --display: Bahnschrift, 'Segoe UI Variable Display', 'DIN Alternate', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --body: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei UI', 'Microsoft YaHei', sans-serif;

  min-height: calc(100vh - 84px);
  color: var(--ink);
  font-family: var(--body);
  background:
    radial-gradient(900px 320px at 0% 0%, rgba(29, 111, 216, 0.1), transparent 55%),
    radial-gradient(700px 280px at 100% 0%, rgba(13, 138, 104, 0.08), transparent 50%),
    linear-gradient(180deg, #dce7f0 0%, #eef3f7 28%, #f5f8fb 100%);
}

.hero {
  position: relative;
  margin: 0;
  padding: 18px clamp(16px, 2.5vw, 36px) 8px;
  color: var(--ink);
  animation: fade-up 0.65s ease both;
}

.hero-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.9fr);
  gap: 20px;
  align-items: stretch;
  padding: 22px 24px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background:
    linear-gradient(135deg, rgba(29, 111, 216, 0.06), transparent 42%),
    linear-gradient(225deg, rgba(13, 138, 104, 0.05), transparent 40%),
    linear-gradient(180deg, #fff 0%, #f7fafc 100%);
  box-shadow: 0 14px 34px rgba(19, 35, 58, 0.06);
}

.hero-brand-block {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
}

.hero-logo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  object-fit: cover;
  background: #fff;
  border: 1px solid var(--line);
  box-shadow: 0 10px 24px rgba(19, 35, 58, 0.08);
  flex-shrink: 0;
}

.hero-brand-copy {
  min-width: 0;
}

.hero-brand-name {
  margin: 0;
  font-family: var(--display);
  font-size: clamp(22px, 2.8vw, 30px);
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.2;
  color: var(--ink);
}

.hero-brand-en {
  margin: 4px 0 0;
  font-size: 11px;
  letter-spacing: 0.16em;
  color: var(--ink-faint);
}

.hero-title {
  margin: 14px 0 8px;
  font-size: clamp(18px, 2.2vw, 24px);
  font-weight: 700;
  line-height: 1.35;
  color: var(--ink);
}

.hero-lead {
  margin: 0;
  max-width: 38em;
  font-size: 14px;
  line-height: 1.7;
  color: var(--ink-soft);
}

.hero-side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
}

.hero-cta-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.cta {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid transparent;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    transform: translateY(-2px);
  }
}

.cta-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;

  .svg-icon {
    width: 18px;
    height: 18px;
  }
}

.cta-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cta-label {
  font-size: 12px;
  opacity: 0.72;
}

.cta strong {
  font-family: var(--display);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
}

.cta-arrow {
  color: inherit;
  opacity: 0.55;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.cta:not(:disabled):hover .cta-arrow {
  opacity: 1;
  transform: translateX(2px);
}

.cta--wms {
  color: #0f3f7a;
  background: linear-gradient(135deg, #edf5ff, #e4effc);
  border-color: rgba(29, 111, 216, 0.18);
  box-shadow: 0 8px 20px rgba(29, 111, 216, 0.08);

  .cta-icon {
    background: linear-gradient(145deg, #3b8af0, var(--wms));
  }

  &:not(:disabled):hover {
    box-shadow: 0 12px 26px rgba(29, 111, 216, 0.14);
  }
}

.cta--mes {
  color: #0a5a42;
  background: linear-gradient(135deg, #eaf8f2, #e2f4ec);
  border-color: rgba(13, 138, 104, 0.18);
  box-shadow: 0 8px 20px rgba(13, 138, 104, 0.08);

  .cta-icon {
    background: linear-gradient(145deg, #19a87d, var(--mes));
  }

  &:not(:disabled):hover {
    box-shadow: 0 12px 26px rgba(13, 138, 104, 0.14);
  }
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(19, 35, 58, 0.03);
  border: 1px solid var(--line);
  font-size: 13px;
  color: var(--ink-soft);
}

.meta-chip {
  padding: 3px 10px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid var(--line);
  color: var(--ink);
  font-weight: 600;
}

.meta-sep {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(19, 35, 58, 0.22);
}

.meta-clock,
.meta-ver {
  font-variant-numeric: tabular-nums;
}

.main {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 12px clamp(16px, 2.5vw, 36px) 28px;
}

.block {
  margin-bottom: 28px;
  animation: fade-up 0.65s ease both;
  animation-delay: 0.08s;
}

.block--loading {
  padding: 8px 0 20px;
}

.block-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--ink);
  }

  p {
    margin: 0;
    font-size: 13px;
    color: var(--ink-soft);
  }
}

.block-title-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.block-index {
  font-family: var(--display);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
}

.gateway {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.gateway-panel {
  position: relative;
  padding: 20px;
  border-radius: 20px;
  border: 1px solid var(--line);
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
  box-shadow: 0 12px 30px rgba(19, 35, 58, 0.06);
  overflow: hidden;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 36px rgba(19, 35, 58, 0.1);
  }
}

.gateway-glow {
  position: absolute;
  width: 180px;
  height: 180px;
  right: -40px;
  top: -60px;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(8px);
  opacity: 0.45;
}

.gateway-head {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: start;
  margin-bottom: 16px;
}

.gateway-mark {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #fff;
  box-shadow: 0 8px 18px rgba(19, 35, 58, 0.14);

  .svg-icon {
    width: 20px;
    height: 20px;
  }
}

.gateway-copy {
  min-width: 0;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }

  p {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--ink-soft);
  }
}

.gateway-go {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: rgba(19, 35, 58, 0.04);
  color: var(--ink);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.gateway-links {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.gateway-link {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 11px 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--ink);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
  animation: fade-up 0.45s ease both;
  animation-delay: calc(var(--i) * 0.03s);

  .svg-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }

  &:hover {
    transform: translateY(-1px);
  }
}

.is-wms {
  &::before {
    background: var(--wms);
  }

  .gateway-glow {
    background: rgba(29, 111, 216, 0.18);
  }

  .gateway-mark {
    background: linear-gradient(145deg, #3b8af0, var(--wms));
  }

  .gateway-go {
    color: var(--wms);

    &:hover {
      background: var(--wms-soft);
      border-color: rgba(29, 111, 216, 0.2);
    }
  }

  .gateway-link:hover {
    color: var(--wms);
    border-color: rgba(29, 111, 216, 0.35);
    background: var(--wms-soft);
  }
}

.is-mes {
  &::before {
    background: var(--mes);
  }

  .gateway-glow {
    background: rgba(13, 138, 104, 0.16);
  }

  .gateway-mark {
    background: linear-gradient(145deg, #19a87d, var(--mes));
  }

  .gateway-go {
    color: var(--mes);

    &:hover {
      background: var(--mes-soft);
      border-color: rgba(13, 138, 104, 0.2);
    }
  }

  .gateway-link:hover {
    color: var(--mes);
    border-color: rgba(13, 138, 104, 0.35);
    background: var(--mes-soft);
  }
}

.capability {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.capability-card {
  display: flex;
  flex-direction: column;
  min-height: 240px;
  border-radius: 20px;
  border: 1px solid transparent;
  overflow: hidden;
  box-shadow: 0 14px 32px rgba(19, 35, 58, 0.08);
  animation: fade-up 0.55s ease both;
  animation-delay: calc(0.08s + var(--i) * 0.06s);
  transition: transform 0.22s ease, box-shadow 0.22s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(19, 35, 58, 0.12);
  }
}

.capability-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 18px 18px 14px;
  border: none;
  color: #f5f8fb;
  text-align: left;
  cursor: pointer;
  background: transparent;
}

.capability-top {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.capability-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(6px);

  .svg-icon {
    width: 20px;
    height: 20px;
  }
}

.capability-count {
  font-size: 12px;
  color: rgba(245, 248, 251, 0.7);
}

.capability-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}

.capability-desc {
  font-size: 12px;
  line-height: 1.55;
  color: rgba(245, 248, 251, 0.72);
  min-height: 38px;
}

.capability-enter {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
}

.capability-links {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: rgba(255, 255, 255, 0.12);
  padding: 0;
}

.capability-link {
  padding: 10px 16px;
  border: none;
  background: rgba(8, 18, 28, 0.18);
  color: rgba(255, 255, 255, 0.88);
  text-align: left;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(8, 18, 28, 0.28);
    color: #fff;
  }
}

.is-scada.capability-card {
  background: linear-gradient(160deg, #d98b1f 0%, #9a5a0d 100%);
}

.is-report.capability-card {
  background: linear-gradient(160deg, #5b6e86 0%, #334155 100%);
}

.is-iot.capability-card {
  background: linear-gradient(160deg, #14a8c2 0%, #0b6f86 100%);
}

.is-automation.capability-card {
  background: linear-gradient(160deg, #2a9b8f 0%, #145e58 100%);
}

.console {
  border: 1px solid var(--line);
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)),
    #fff;
  box-shadow: 0 16px 40px rgba(19, 35, 58, 0.06);
  overflow: hidden;
}

.console-bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 20px 22px 14px;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--ink);
  }
}

.console-hint {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--ink-soft);
}

.console-search {
  width: min(320px, 100%);

  :deep(.el-input__wrapper) {
    border-radius: 12px;
    box-shadow: 0 0 0 1px var(--line) inset;
    background: #fff;
  }

  :deep(.el-input__inner) {
    color: var(--ink);
  }

  :deep(.el-input__inner::placeholder) {
    color: var(--ink-faint);
  }
}

.console-tabs {
  display: flex;
  gap: 8px;
  padding: 0 22px 14px;
  border-bottom: 1px solid var(--line);
  overflow-x: auto;
}

.console-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--ink-soft);
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;

  em {
    font-style: normal;
    font-family: var(--display);
    font-size: 12px;
    font-weight: 700;
    color: var(--ink-faint);
  }

  &:hover {
    background: rgba(19, 35, 58, 0.04);
    color: var(--ink);
  }

  &.is-active {
    color: var(--ink);
    background: rgba(29, 111, 216, 0.08);
    border-color: rgba(29, 111, 216, 0.18);

    em {
      color: var(--wms);
    }
  }
}

.console-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  padding: 8px;
}

.console-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px 14px;
  margin: 4px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
  animation: fade-up 0.4s ease both;
  animation-delay: calc(var(--i) * 0.02s);

  &:hover {
    background: #fff;
    border-color: var(--line);
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(19, 35, 58, 0.05);
  }
}

.console-row-mark {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: #fff;

  .svg-icon {
    width: 17px;
    height: 17px;
  }
}

.console-row-fallback {
  font-family: var(--display);
  font-size: 14px;
  font-weight: 700;
}

.console-row-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  strong {
    font-size: 14px;
    font-weight: 650;
    color: var(--ink);
  }

  small {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    font-size: 11px;
    color: var(--ink-faint);

    > span:last-child {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.console-tag {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(19, 35, 58, 0.06);
  color: var(--ink-soft);
  font-size: 11px;
  font-weight: 600;
}

.console-row-arrow {
  color: var(--ink-faint);
  transition: transform 0.2s ease, color 0.2s ease;
}

.console-row:hover .console-row-arrow {
  transform: translateX(3px);
}

.tone-wms .console-row-mark {
  background: linear-gradient(145deg, #3b8af0, var(--wms));
}

.tone-mes .console-row-mark {
  background: linear-gradient(145deg, #19a87d, var(--mes));
}

.tone-scada .console-row-mark {
  background: linear-gradient(145deg, #e09a2b, var(--scada));
}

.tone-report .console-row-mark {
  background: linear-gradient(145deg, #6b7d93, var(--report));
}

.tone-iot .console-row-mark {
  background: linear-gradient(145deg, #19adc8, var(--iot));
}

.tone-auto .console-row-mark {
  background: linear-gradient(145deg, #2a9b94, var(--auto));
}

.tone-other .console-row-mark {
  background: linear-gradient(145deg, #64748b, #475569);
}

.tone-wms:hover .console-row-arrow,
.tone-wms:hover .console-tag {
  color: var(--wms);
}

.tone-mes:hover .console-row-arrow,
.tone-mes:hover .console-tag {
  color: var(--mes);
}

.footer {
  width: 100%;
  max-width: none;
  margin: 4px 0 0;
  padding: 0 clamp(16px, 2.5vw, 36px) 8px;
  text-align: center;
  font-size: 12px;
  color: var(--ink-faint);
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1100px) {
  .hero-shell {
    grid-template-columns: 1fr;
  }

  .capability {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 14px 14px 4px;
  }

  .hero-shell {
    padding: 16px;
  }

  .hero-brand-block {
    flex-direction: column;
  }

  .gateway,
  .gateway-links,
  .capability,
  .console-list {
    grid-template-columns: 1fr;
  }

  .main,
  .footer {
    padding-left: 14px;
    padding-right: 14px;
  }

  .block-head,
  .console-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .console-search {
    width: 100%;
  }
}
</style>
