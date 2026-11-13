<template>
  <el-dialog v-model="dialogVisible" title="条码规则正则测试" width="600px" append-to-body destroy-on-close class="sn-regex-test-dialog" @closed="handleClosed">
    <el-alert type="info" :closable="false" show-icon class="mb-4" :title="regexHint" />
    <el-form label-width="88px" @submit.prevent>
      <el-form-item label="正则规则" :validate-status="regexPattern && regexInvalid ? 'error' : ''">
        <el-input v-model="regexPattern" type="textarea" :rows="2" :placeholder="regexPlaceholder" clearable :class="{ 'sn-regex-input--error': regexPattern && regexInvalid }" />
      </el-form-item>
      <el-form-item label="测试内容">
        <el-input v-model="testContent" type="textarea" :rows="3" placeholder="输入待匹配的条码或文本" clearable @keyup.enter.ctrl="runTest" />
      </el-form-item>
      <el-form-item v-if="testContent" label="匹配预览">
        <div class="sn-regex-highlight-box" :class="{ 'is-regex-invalid': regexPattern && regexInvalid }">
          <pre class="sn-regex-highlight-text"><template
            v-for="(segment, index) in highlightSegments"
            :key="index"
          ><span :class="{ 'is-match': segment.matched }">{{ segment.text }}</span></template></pre>
        </div>
        <div v-if="regexPattern && !regexInvalid" class="sn-regex-meta">
          <span v-if="matchCount > 0">共 {{ matchCount }} 处匹配</span>
          <span v-else>无匹配片段</span>
          <span v-if="captureGroups.length" class="sn-regex-groups">
            捕获组：
            <span v-for="group in captureGroups" :key="group.index" class="sn-regex-group-tag"> ${{ group.index }} = {{ group.display }} </span>
          </span>
        </div>
      </el-form-item>
    </el-form>
    <div v-if="showLiveFeedback" class="sn-regex-test-result">
      <el-alert v-if="regexPattern && regexInvalid" type="error" :closable="false" :title="regexError" show-icon />
      <el-alert v-else-if="regexPattern && regexSyntaxOk && !testContent" type="info" :closable="false" title="正则语法正确，请输入测试内容查看实时匹配高亮" show-icon />
      <el-alert v-else-if="!regexPattern && testContent" type="info" :closable="false" title="请先输入正则规则" show-icon />
      <el-alert v-else-if="isMatch" type="success" :closable="false" title="匹配成功" show-icon>
        <template #default>
          <div v-if="matchSummary">{{ matchSummary }}</div>
        </template>
      </el-alert>
      <el-alert v-else-if="regexPattern && testContent" type="warning" :closable="false" title="不匹配" show-icon />
    </div>
    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
      <el-button type="primary" @click="runTest">验证</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';

const regexHint = '使用与列表「条码规则」相同的 JavaScript 正则语法；输入规则与测试内容后将实时校验语法并高亮匹配片段。';
const regexPlaceholder = '例如 ^13011004408-07$\\d{4}$';

type HighlightSegment = { text: string; matched: boolean };
type CaptureGroupItem = { index: number; display: string };

const props = defineProps<{
  visible: boolean;
  defaultRegex?: string;
  defaultContent?: string;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const regexPattern = ref('');
const testContent = ref('');
const showLiveFeedback = ref(false);
const regexSyntaxOk = ref(false);
const isMatch = ref(false);
const regexInvalid = ref(false);
const regexError = ref('');
const matchSummary = ref('');
const highlightSegments = ref<HighlightSegment[]>([]);
const matchCount = ref(0);
const captureGroups = ref<CaptureGroupItem[]>([]);

const emptyGroupDisplay = '(空)';

const REGEX_INVALID_MESSAGE = '正则无效';

const isRegexStructureInvalid = (pattern: string): boolean => {
  let paren = 0;
  let bracket = 0;
  let brace = 0;

  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === '(') {
      paren++;
    } else if (ch === ')') {
      paren--;
      if (paren < 0) {
        return true;
      }
    } else if (ch === '[') {
      bracket++;
    } else if (ch === ']') {
      bracket--;
      if (bracket < 0) {
        return true;
      }
    } else if (ch === '{') {
      if (/^\{\d/.test(pattern.slice(i))) {
        brace++;
      }
    } else if (ch === '}') {
      brace--;
      if (brace < 0) {
        return true;
      }
    }
  }

  return paren !== 0 || bracket !== 0 || brace !== 0;
};

const isRegexPatternValid = (pattern: string): boolean => {
  if (isRegexStructureInvalid(pattern)) {
    return false;
  }
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
};

const failRegexValidation = () => {
  regexInvalid.value = true;
  regexSyntaxOk.value = false;
  regexError.value = REGEX_INVALID_MESSAGE;
  isMatch.value = false;
  matchSummary.value = '';
  matchCount.value = 0;
  captureGroups.value = [];
};

const resetPlainHighlight = (content: string) => {
  highlightSegments.value = content ? [{ text: content, matched: false }] : [];
  matchCount.value = 0;
  captureGroups.value = [];
  isMatch.value = false;
  matchSummary.value = '';
};

const resetResult = () => {
  showLiveFeedback.value = false;
  regexSyntaxOk.value = false;
  isMatch.value = false;
  regexInvalid.value = false;
  regexError.value = '';
  matchSummary.value = '';
  highlightSegments.value = [];
  matchCount.value = 0;
  captureGroups.value = [];
};

const buildHighlightSegments = (content: string, pattern: string) => {
  const ranges: { start: number; end: number }[] = [];
  const reGlobal = new RegExp(pattern, 'g');
  let execResult: RegExpExecArray | null;

  while ((execResult = reGlobal.exec(content)) !== null) {
    ranges.push({ start: execResult.index, end: execResult.index + execResult[0].length });
    if (execResult[0] === '') {
      reGlobal.lastIndex += 1;
      if (reGlobal.lastIndex > content.length) {
        break;
      }
    }
  }

  matchCount.value = ranges.length;

  if (!ranges.length) {
    highlightSegments.value = [{ text: content, matched: false }];
    captureGroups.value = [];
    return;
  }

  const firstMatch = new RegExp(pattern).exec(content);
  if (firstMatch && firstMatch.length > 1) {
    captureGroups.value = firstMatch.slice(1).map((value, index) => ({
      index: index + 1,
      display: value === undefined || value === '' ? emptyGroupDisplay : value
    }));
  } else {
    captureGroups.value = [];
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) {
      segments.push({ text: content.slice(cursor, range.start), matched: false });
    }
    segments.push({ text: content.slice(range.start, range.end), matched: true });
    cursor = range.end;
  }
  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor), matched: false });
  }
  highlightSegments.value = segments;
};

const updateMatchSummary = (content: string, regexp: RegExp) => {
  if (!isMatch.value) {
    matchSummary.value = '';
    return;
  }
  const match = content.match(regexp);
  if (!match) {
    matchSummary.value = '';
    return;
  }
  const fullTextHit = match[0] === content;
  const countHint = matchCount.value > 1 ? `（共 ${matchCount.value} 处）` : '';
  matchSummary.value = fullTextHit ? `全文匹配：${match[0]}${countHint}` : `命中片段：${match[0]}${countHint}`;
};

const evaluateRegex = () => {
  const pattern = regexPattern.value;
  const content = testContent.value;

  showLiveFeedback.value = Boolean(pattern || content);

  if (content) {
    resetPlainHighlight(content);
  } else {
    highlightSegments.value = [];
    matchCount.value = 0;
    captureGroups.value = [];
  }

  if (!pattern) {
    regexInvalid.value = false;
    regexError.value = '';
    regexSyntaxOk.value = false;
    isMatch.value = false;
    matchSummary.value = '';
    return;
  }

  if (!isRegexPatternValid(pattern)) {
    failRegexValidation();
    return;
  }

  const regexp = new RegExp(pattern);
  regexInvalid.value = false;
  regexError.value = '';
  regexSyntaxOk.value = true;

  if (!content) {
    isMatch.value = false;
    matchSummary.value = '';
    return;
  }

  isMatch.value = regexp.test(content);
  buildHighlightSegments(content, pattern);
  updateMatchSummary(content, regexp);
};

const debouncedEvaluate = useDebounceFn(evaluateRegex, 180);

const runTest = () => {
  evaluateRegex();
};

const handleClosed = () => {
  resetResult();
  regexPattern.value = '';
  testContent.value = '';
};

watch([regexPattern, testContent], () => {
  debouncedEvaluate();
});

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      regexPattern.value = props.defaultRegex || '';
      testContent.value = props.defaultContent || '';
      resetResult();
      evaluateRegex();
    }
  }
);
</script>

<style scoped lang="scss">
.sn-regex-test-result {
  margin-top: 4px;
}

.mb-4 {
  margin-bottom: 16px;
}

.sn-regex-input--error :deep(.el-textarea__inner) {
  border-color: var(--el-color-danger);
  background-color: var(--el-color-danger-light-9);
}

.sn-regex-input--error :deep(.el-textarea__inner:focus) {
  border-color: var(--el-color-danger);
  box-shadow: 0 0 0 1px var(--el-color-danger) inset;
}

.sn-regex-highlight-box {
  width: 100%;
  min-height: 72px;
  max-height: 168px;
  overflow: auto;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-blank);

  &.is-regex-invalid {
    border-color: var(--el-color-danger);
    box-shadow: 0 0 0 1px var(--el-color-danger-light-7) inset;
    background: var(--el-color-danger-light-9);
  }
}

.sn-regex-highlight-text {
  margin: 0;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-all;
}

.sn-regex-highlight-text .is-match {
  padding: 0 1px;
  border-radius: 2px;
  color: #135200;
  background: #d9f7be;
  box-shadow: 0 0 0 1px #b7eb8f;
}

.sn-regex-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.sn-regex-groups {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.sn-regex-group-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
</style>
