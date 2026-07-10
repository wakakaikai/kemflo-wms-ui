<template>
  <div class="shortage-panel" :class="{ 'is-flex': flex, [`tone-${tone}`]: true }">
    <div class="panel-title-bar">
      <div class="panel-title-left">
        <span class="panel-title-accent" />
        <span class="panel-title-text">
          <slot name="title">{{ title }}</slot>
        </span>
      </div>
      <div v-if="$slots['title-extra']" class="panel-title-extra">
        <slot name="title-extra" />
      </div>
    </div>
    <div class="panel-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    flex?: boolean;
    tone?: 'cyan' | 'orange' | 'danger';
  }>(),
  { tone: 'cyan' }
);
</script>

<style scoped lang="scss">
.shortage-panel {
  --panel-border: rgba(25, 186, 139, 0.17);
  --panel-accent: #02a6b5;
  --panel-title-color: #fff;

  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 0;
  padding: 0 12px 12px;
  border: 1px solid var(--panel-border);
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;

  &.tone-orange {
    --panel-border: rgba(242, 151, 1, 0.22);
    --panel-accent: #f29701;
  }

  &.tone-danger {
    --panel-border: rgba(245, 108, 108, 0.22);
    --panel-accent: #ff8787;
  }

  &.is-flex {
    flex: 1;
    min-height: 0;

    .panel-body {
      flex: 1;
      min-height: 0;
    }
  }
}

.panel-title-bar {
  flex-shrink: 0;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 2px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.panel-title-left {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-title-extra {
  flex-shrink: 0;
}

.panel-title-accent {
  flex-shrink: 0;
  width: 4px;
  height: 17px;
  border-radius: 1px;
  background: var(--panel-accent);
  box-shadow: 0 0 8px rgba(2, 166, 181, 0.45);
}

.tone-orange .panel-title-accent {
  box-shadow: 0 0 8px rgba(242, 151, 1, 0.45);
}

.tone-danger .panel-title-accent {
  box-shadow: 0 0 8px rgba(245, 108, 108, 0.45);
}

.panel-title-text {
  color: var(--panel-title-color);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-body {
  position: relative;
  padding: 10px 2px 2px;
  min-height: 0;
}
</style>
