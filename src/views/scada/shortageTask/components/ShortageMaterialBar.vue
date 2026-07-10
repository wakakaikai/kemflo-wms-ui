<template>
  <ul v-if="displayItems.length" class="rank-list">
    <li
      v-for="item in displayItems"
      :key="item.materialCode"
      class="rank-row"
      :class="`rank-${item.rank}`"
    >
      <div class="rank-medal">
        <span class="medal-num">{{ item.rank }}</span>
      </div>
      <div class="rank-card">
        <span class="card-corner card-corner-tl" />
        <span class="card-corner card-corner-tr" />
        <span class="card-corner card-corner-bl" />
        <span class="card-corner card-corner-br" />
        <div class="rank-head">
          <div class="mat-code" :title="item.materialCode">{{ item.materialCode }}</div>
          <span class="mat-qty">{{ displayQty(item.qty) }}</span>
        </div>
        <p class="mat-name" :title="item.materialName">{{ item.materialName }}</p>
      </div>
    </li>
  </ul>
  <div v-else class="rank-empty">暂无缺料排行数据</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatQty } from '@/utils/ruoyi';

export interface MaterialBarItem {
  rank: number;
  materialCode: string;
  materialName: string;
  qty: number;
  pct: number;
}

const props = defineProps<{
  items: MaterialBarItem[];
}>();

const displayItems = computed(() => props.items.slice(0, 5));

function displayQty(value: number) {
  return formatQty(value);
}
</script>

<style scoped lang="scss">
.rank-list {
  list-style: none;
  margin: 0;
  padding: 4px 2px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 168px;
}

.rank-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
  min-height: 0;
}

.rank-medal {
  flex-shrink: 0;
  width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
}

.medal-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  font-weight: 700;
  color: #8ee8ff;
  background: radial-gradient(circle at 30% 30%, rgba(142, 232, 255, 0.35), rgba(9, 130, 142, 0.2));
  border: 1px solid rgba(10, 193, 199, 0.45);
  box-shadow: 0 0 8px rgba(10, 193, 199, 0.25);
}

.rank-card {
  flex: 1;
  min-width: 0;
  position: relative;
  padding: 7px 10px 6px;
  border: 1px solid rgba(10, 193, 199, 0.22);
  background: linear-gradient(90deg, rgba(9, 130, 142, 0.14), rgba(255, 255, 255, 0.02));
  box-shadow: inset 0 0 12px rgba(10, 193, 199, 0.04);
}

.rank-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  line-height: 22px;
}

.mat-code {
  flex: 1;
  min-width: 0;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 14px;
  color: #b8ecff;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mat-qty {
  flex-shrink: 0;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 16px;
  font-weight: 700;
  color: #09c2c8;
  text-shadow: 0 0 8px rgba(9, 194, 200, 0.35);
}

.mat-name {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 13px;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-corner {
  position: absolute;
  width: 6px;
  height: 6px;
  border-color: rgba(10, 193, 199, 0.55);
  border-style: solid;
  opacity: 0.85;
}

.card-corner-tl {
  left: -1px;
  top: -1px;
  border-width: 1px 0 0 1px;
}

.card-corner-tr {
  right: -1px;
  top: -1px;
  border-width: 1px 1px 0 0;
}

.card-corner-bl {
  left: -1px;
  bottom: -1px;
  border-width: 0 0 1px 1px;
}

.card-corner-br {
  right: -1px;
  bottom: -1px;
  border-width: 0 1px 1px 0;
}

/* 第1名：金 */
.rank-1 {
  .medal-num {
    color: #4a3200;
    background: radial-gradient(circle at 30% 28%, #fff4c2, #ffd54f 42%, #f29701 78%, #c97800);
    border-color: rgba(255, 210, 90, 0.95);
    box-shadow:
      0 0 12px rgba(255, 193, 70, 0.55),
      inset 0 1px 2px rgba(255, 255, 255, 0.45);
  }

  .rank-card {
    border-color: rgba(242, 151, 1, 0.42);
    background: linear-gradient(90deg, rgba(242, 151, 1, 0.18), rgba(255, 255, 255, 0.03));
    box-shadow:
      0 0 14px rgba(242, 151, 1, 0.12),
      inset 0 0 14px rgba(242, 151, 1, 0.06);
  }

  .mat-code {
    color: #ffe8c8;
  }

  .mat-qty {
    color: #ffb347;
    text-shadow: 0 0 10px rgba(255, 179, 71, 0.45);
  }

  .card-corner {
    border-color: rgba(255, 179, 71, 0.7);
  }
}

/* 第2名：银 */
.rank-2 {
  .medal-num {
    color: #3a4450;
    background: radial-gradient(circle at 30% 28%, #ffffff, #e4ebf2 38%, #b7c4d1 72%, #8f9eac);
    border-color: rgba(214, 226, 236, 0.95);
    box-shadow:
      0 0 10px rgba(190, 205, 220, 0.45),
      inset 0 1px 2px rgba(255, 255, 255, 0.55);
  }

  .rank-card {
    border-color: rgba(176, 192, 208, 0.38);
    background: linear-gradient(90deg, rgba(176, 192, 208, 0.16), rgba(255, 255, 255, 0.03));
    box-shadow:
      0 0 12px rgba(176, 192, 208, 0.1),
      inset 0 0 12px rgba(176, 192, 208, 0.05);
  }

  .mat-code {
    color: #edf4fb;
  }

  .mat-qty {
    color: #d2dde8;
    text-shadow: 0 0 8px rgba(190, 205, 220, 0.35);
  }

  .card-corner {
    border-color: rgba(190, 205, 220, 0.65);
  }
}

/* 第3名：铜 */
.rank-3 {
  .medal-num {
    color: #4a2b12;
    background: radial-gradient(circle at 30% 28%, #f0c9a0, #d38b4f 42%, #b87333 76%, #8b5a2b);
    border-color: rgba(214, 148, 90, 0.95);
    box-shadow:
      0 0 10px rgba(205, 127, 50, 0.45),
      inset 0 1px 2px rgba(255, 220, 190, 0.35);
  }

  .rank-card {
    border-color: rgba(184, 115, 51, 0.38);
    background: linear-gradient(90deg, rgba(184, 115, 51, 0.16), rgba(255, 255, 255, 0.03));
    box-shadow:
      0 0 12px rgba(184, 115, 51, 0.1),
      inset 0 0 12px rgba(184, 115, 51, 0.05);
  }

  .mat-code {
    color: #f5dcc4;
  }

  .mat-qty {
    color: #d38b4f;
    text-shadow: 0 0 8px rgba(205, 127, 50, 0.35);
  }

  .card-corner {
    border-color: rgba(205, 127, 50, 0.65);
  }
}

.rank-empty {
  min-height: 168px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(200, 220, 255, 0.38);
  font-size: 15px;
}

</style>
