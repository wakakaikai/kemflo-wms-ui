<template>
  <section class="notice-board">
    <article class="notice-panel notice-panel--site">
      <header class="notice-panel-head">
        <div>
          <div class="notice-panel-title">
            <span class="notice-dot notice-dot--site" />
            <h3>{{ MSG.siteNoticeTitle }}</h3>
            <em v-if="siteUnreadCount">{{ siteUnreadCount }}</em>
          </div>
          <p>{{ MSG.siteNoticeDesc }}</p>
        </div>
        <div class="notice-panel-actions">
          <button type="button" class="notice-text-btn" :disabled="!siteUnreadCount" @click="markSiteAllRead">{{ MSG.markAllRead }}</button>
          <button type="button" class="notice-text-btn" @click="refreshSite">{{ MSG.refresh }}</button>
        </div>
      </header>

      <div v-loading="siteLoading" class="notice-panel-body">
        <button
          v-for="item in siteNotices"
          :key="item.key"
          type="button"
          class="notice-item"
          :class="{ 'is-unread': !item.read }"
          @click="openSiteNotice(item)"
        >
          <span class="notice-item-badge">{{ item.tag }}</span>
          <span class="notice-item-main">
            <strong>{{ item.title }}</strong>
            <small>{{ item.summary }}</small>
          </span>
          <span class="notice-item-time">{{ item.timeText }}</span>
        </button>
        <el-empty v-if="!siteLoading && !siteNotices.length" :image-size="56" :description="MSG.noSiteNotice" />
      </div>
    </article>

    <article class="notice-panel notice-panel--call">
      <header class="notice-panel-head">
        <div>
          <div class="notice-panel-title">
            <span class="notice-dot notice-dot--call" />
            <h3>{{ MSG.callTitle }}</h3>
            <em v-if="callUnreadCount">{{ callUnreadCount }}</em>
          </div>
          <p>{{ MSG.callDesc }}</p>
        </div>
        <div class="notice-panel-actions">
          <button type="button" class="notice-text-btn" @click="goAbnormalBoard">{{ MSG.callBoard }}</button>
          <button type="button" class="notice-text-btn" @click="refreshCall">{{ MSG.refresh }}</button>
        </div>
      </header>

      <div v-loading="callLoading" class="notice-panel-body">
        <button
          v-for="item in callNotices"
          :key="item.key"
          type="button"
          class="notice-item notice-item--call"
          :class="{ 'is-unread': !item.read, 'is-active': item.status === 1 }"
          @click="openCallNotice(item)"
        >
          <span class="notice-item-badge">{{ item.tag }}</span>
          <span class="notice-item-main">
            <strong>{{ item.title }}</strong>
            <small>
              <span v-if="item.workStationDesc || item.workStation">{{ item.workStationDesc || item.workStation }}</span>
              <span v-if="item.summary"> · {{ item.summary }}</span>
            </small>
          </span>
          <span class="notice-item-time">{{ item.timeText }}</span>
        </button>
        <el-empty v-if="!callLoading && !callNotices.length" :image-size="56" :description="MSG.noCallNotice" />
      </div>
    </article>

    <el-dialog v-model="detailVisible" :title="detailTitle" width="520px" append-to-body destroy-on-close>
      <div class="notice-detail">
        <div class="notice-detail-meta">
          <span v-if="detailMeta">{{ detailMeta }}</span>
          <span v-if="detailTime">{{ detailTime }}</span>
        </div>
        <div class="notice-detail-content" v-html="detailContent" />
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">{{ MSG.close }}</el-button>
        <el-button v-if="detailKind === 'call'" type="primary" @click="goAbnormalBoard">{{ MSG.goCallBoard }}</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { listNotice } from '@/api/system/notice';
import { markMessageAsRead, queryReceivedMessageList } from '@/api/mes/message';
import { useNoticeStore } from '@/store/modules/notice';
import { useAbnormalCallNoticeStore } from '@/store/modules/abnormalCallNotice';
import { parseTime } from '@/utils/ruoyi';
import { MSG } from '@/views/home/messages';

interface DisplayNotice {
  key: string;
  title: string;
  summary: string;
  content: string;
  time: string;
  timeText: string;
  read: boolean;
  tag: string;
  source: 'system' | 'sse' | 'call';
  status?: number;
  workStation?: string;
  workStationDesc?: string;
  rawId?: string | number;
}

const router = useRouter();
const noticeStore = useNoticeStore();
const abnormalCallStore = useAbnormalCallNoticeStore();
const { state: siteState } = storeToRefs(noticeStore);
const { state: callState } = storeToRefs(abnormalCallStore);

const siteLoading = ref(false);
const callLoading = ref(false);
const systemNotices = ref<DisplayNotice[]>([]);
const apiCallNotices = ref<DisplayNotice[]>([]);

const detailVisible = ref(false);
const detailKind = ref<'site' | 'call'>('site');
const detailTitle = ref('');
const detailContent = ref('');
const detailMeta = ref('');
const detailTime = ref('');

let refreshTimer: ReturnType<typeof setInterval> | null = null;

const stripHtml = (html = '') =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const formatTime = (value?: string) => {
  if (!value) return '';
  return parseTime(value, '{y}-{m}-{d} {h}:{i}') || value;
};

const sseSiteNotices = computed<DisplayNotice[]>(() =>
  (siteState.value.notices || []).slice(0, 8).map((item) => ({
    key: `sse-${item.id}`,
    title: item.title || MSG.siteMessage,
    summary: item.message,
    content: item.message,
    time: item.time,
    timeText: formatTime(item.time),
    read: !!item.read,
    tag: item.category === 'alert' ? MSG.alert : MSG.message,
    source: 'sse' as const,
    rawId: item.id
  }))
);

const siteNotices = computed(() => {
  const merged = [...sseSiteNotices.value, ...systemNotices.value];
  const unique = new Map<string, DisplayNotice>();
  merged.forEach((item) => {
    const dedupeKey = `${item.title}-${item.timeText}-${item.summary.slice(0, 24)}`;
    if (!unique.has(dedupeKey)) unique.set(dedupeKey, item);
  });
  return Array.from(unique.values())
    .sort((a, b) => Number(new Date(b.time || 0)) - Number(new Date(a.time || 0)))
    .slice(0, 8);
});

const storeCallNotices = computed<DisplayNotice[]>(() =>
  (callState.value.notices || []).slice(0, 8).map((item) => ({
    key: `store-call-${item.id}`,
    title: item.title || MSG.abnormalCall,
    summary: item.message,
    content: item.message,
    time: item.time,
    timeText: formatTime(item.time),
    read: !!item.read,
    tag: MSG.callTag,
    source: 'call' as const,
    status: Number(item.metadata?.status ?? 1),
    workStation: item.workStation,
    workStationDesc: item.workStationDesc,
    rawId: item.id
  }))
);

const callNotices = computed(() => {
  const merged = [...storeCallNotices.value, ...apiCallNotices.value];
  const unique = new Map<string, DisplayNotice>();
  merged.forEach((item) => {
    const idKey = String(item.rawId || item.key);
    if (!unique.has(idKey)) unique.set(idKey, item);
  });
  return Array.from(unique.values())
    .sort((a, b) => Number(new Date(b.time || 0)) - Number(new Date(a.time || 0)))
    .slice(0, 8);
});

const siteUnreadCount = computed(() => siteNotices.value.filter((item) => !item.read).length);
const callUnreadCount = computed(() => callNotices.value.filter((item) => !item.read).length);

const loadSystemNotices = async () => {
  siteLoading.value = true;
  try {
    const res = await listNotice({
      pageNum: 1,
      pageSize: 8,
      noticeTitle: '',
      createByName: '',
      status: '0',
      noticeType: ''
    });
    const rows = res.rows || [];
    systemNotices.value = rows.map((row) => {
      const content = row.noticeContent || '';
      return {
        key: `sys-${row.noticeId}`,
        title: row.noticeTitle || MSG.systemNotice,
        summary: stripHtml(content).slice(0, 48) || MSG.viewDetail,
        content,
        time: row.createTime || '',
        timeText: formatTime(row.createTime),
        read: true,
        tag: String(row.noticeType) === '1' ? MSG.noticeTag : MSG.bulletinTag,
        source: 'system' as const,
        rawId: row.noticeId
      };
    });
  } catch (error) {
    console.error(MSG.loadSiteFail, error);
  } finally {
    siteLoading.value = false;
  }
};

const mapCallRow = (row: any): DisplayNotice => ({
  key: `api-call-${row.id}`,
  title: row.title || MSG.abnormalCall,
  summary: row.content || '',
  content: row.content || '',
  time: row.sendTime || '',
  timeText: formatTime(row.sendTime),
  read: Number(row.readStatus) === 1,
  tag: Number(row.status) === 2 ? MSG.confirmedTag : MSG.pendingTag,
  source: 'call',
  status: Number(row.status),
  workStation: row.workStation,
  workStationDesc: row.workStationDesc,
  rawId: row.id
});

const syncCallToStore = (rows: any[]) => {
  rows.forEach((messageData) => {
    abnormalCallStore.addNotice({
      title: messageData.title || MSG.abnormalCall,
      message: messageData.content,
      category: 'abnormalCall',
      priority: messageData.priority,
      id: messageData.id,
      time: messageData.sendTime,
      read: messageData.readStatus == 1,
      workCenter: messageData.workCenter,
      workStation: messageData.workStation,
      workStationDesc: messageData.workStationDesc,
      messageStatus: messageData.status,
      metadata: messageData
    });
  });
};

const loadCallNotices = async (syncStore = false) => {
  callLoading.value = true;
  try {
    const res = await queryReceivedMessageList({
      pageNum: 1,
      pageSize: 10,
      messageType: 1
    } as any);
    const rows = (res as any).data || (res as any).rows || [];
    apiCallNotices.value = rows.map(mapCallRow);
    if (syncStore) syncCallToStore(rows);
  } catch (error) {
    console.error(MSG.loadCallFail, error);
  } finally {
    callLoading.value = false;
  }
};

const refreshSite = () => loadSystemNotices();
const refreshCall = () => loadCallNotices(true);

const markSiteAllRead = async () => {
  await noticeStore.markAllAsRead();
};

const openSiteNotice = async (item: DisplayNotice) => {
  if (item.source === 'sse' && item.rawId != null) {
    await noticeStore.markAsRead(String(item.rawId));
  }
  detailKind.value = 'site';
  detailTitle.value = item.title;
  detailContent.value = item.content || item.summary;
  detailMeta.value = item.tag;
  detailTime.value = item.timeText;
  detailVisible.value = true;
};

const openCallNotice = async (item: DisplayNotice) => {
  if (item.rawId != null && !item.read) {
    try {
      await markMessageAsRead(item.rawId);
      await abnormalCallStore.markAsRead(String(item.rawId));
      const target = apiCallNotices.value.find((row) => String(row.rawId) === String(item.rawId));
      if (target) target.read = true;
    } catch (error) {
      console.error(MSG.markCallReadFail, error);
    }
  }
  detailKind.value = 'call';
  detailTitle.value = item.title;
  detailContent.value = item.content || item.summary;
  detailMeta.value = [item.workStationDesc || item.workStation, item.tag].filter(Boolean).join(' · ');
  detailTime.value = item.timeText;
  detailVisible.value = true;
};

const goAbnormalBoard = () => {
  detailVisible.value = false;
  router.push('/scada/abnormalCallScada');
};

onMounted(() => {
  loadSystemNotices();
  loadCallNotices(true);
  refreshTimer = setInterval(() => {
    loadCallNotices(false);
  }, 60_000);
});

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});
</script>

<style scoped lang="scss">
.notice-board {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
  margin-bottom: 28px;
  animation: notice-fade-up 0.65s ease both;
}

.notice-panel {
  display: flex;
  flex-direction: column;
  height: auto;
  border: 1px solid rgba(19, 35, 58, 0.1);
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
  box-shadow: 0 14px 32px rgba(19, 35, 58, 0.06);
  overflow: hidden;
}

.notice-panel--call {
  background:
    radial-gradient(420px 160px at 100% 0%, rgba(194, 122, 18, 0.08), transparent 60%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
}

.notice-panel--site {
  background:
    radial-gradient(420px 160px at 100% 0%, rgba(29, 111, 216, 0.08), transparent 60%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
}

.notice-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 12px;
  border-bottom: 1px solid rgba(19, 35, 58, 0.08);

  p {
    margin: 6px 0 0;
    font-size: 12px;
    color: rgba(19, 35, 58, 0.55);
  }
}

.notice-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;

  h3 {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    color: #13233a;
  }

  em {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    font-style: normal;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    background: #e11d48;
  }
}

.notice-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.notice-dot--site {
  background: #1d6fd8;
  box-shadow: 0 0 0 4px rgba(29, 111, 216, 0.12);
}

.notice-dot--call {
  background: #c27a12;
  box-shadow: 0 0 0 4px rgba(194, 122, 18, 0.14);
}

.notice-panel-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.notice-text-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #1d6fd8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: rgba(29, 111, 216, 0.08);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.notice-panel--call .notice-text-btn {
  color: #c27a12;

  &:hover:not(:disabled) {
    background: rgba(194, 122, 18, 0.1);
  }
}

.notice-panel-body {
  flex: 0 1 auto;
  min-height: 0;
  padding: 8px;
  overflow: auto;
  max-height: min(420px, 52vh);
}

.notice-item {
  width: 100%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: start;
  padding: 12px;
  margin-bottom: 4px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;

  &:hover {
    background: #fff;
    border-color: rgba(19, 35, 58, 0.08);
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(19, 35, 58, 0.05);
  }

  &.is-unread {
    background: rgba(29, 111, 216, 0.05);
  }
}

.notice-item--call.is-unread,
.notice-item--call.is-active {
  background: rgba(194, 122, 18, 0.07);
}

.notice-item-badge {
  margin-top: 2px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #1d6fd8;
  background: rgba(29, 111, 216, 0.1);
  white-space: nowrap;
}

.notice-item--call .notice-item-badge {
  color: #c27a12;
  background: rgba(194, 122, 18, 0.12);
}

.notice-item-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    font-size: 13px;
    font-weight: 650;
    color: #13233a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    font-size: 12px;
    line-height: 1.45;
    color: rgba(19, 35, 58, 0.55);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.notice-item-time {
  margin-top: 2px;
  font-size: 11px;
  color: rgba(19, 35, 58, 0.4);
  white-space: nowrap;
}

.notice-detail-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 12px;
  color: rgba(19, 35, 58, 0.55);
}

.notice-detail-content {
  min-height: 80px;
  line-height: 1.7;
  color: #13233a;
  word-break: break-word;
}

@keyframes notice-fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 900px) {
  .notice-board {
    grid-template-columns: 1fr;
  }
}
</style>
