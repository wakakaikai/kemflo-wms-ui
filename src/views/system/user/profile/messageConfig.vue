<!-- messageForm.vue -->
<template>
  <el-form ref="messageRef" :model="form" label-width="auto">
    <el-form-item label="接收呼叫消息">
      <el-checkbox-group v-model="checkedCities" @change="handleCheckedCitiesChange">
        <el-checkbox v-for="messageTitle in messageTitles" :key="messageTitle" :label="messageTitle" :value="messageTitle">
          {{ messageTitle }}
        </el-checkbox>
      </el-checkbox-group>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submit">保存</el-button>
      <el-button type="danger" @click="close">关闭</el-button>
    </el-form-item>
  </el-form>
</template>
<script setup name="MessageConfig" lang="ts">
import { ref, computed, onMounted } from 'vue';

const messageRef = ref<ElFormInstance>();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const form = reactive({
  type: []
});

import type { CheckboxValueType } from 'element-plus';

const checkAll = ref(false);

const checkedCities = ref(['物料呼叫', '设备呼叫', '品质呼叫', '制程呼叫', '其他呼叫']);
const messageTitles = ['物料呼叫', '设备呼叫', '品质呼叫', '制程呼叫', '其他呼叫'];

const handleCheckedCitiesChange = (value: CheckboxValueType[]) => {
  const checkedCount = value.length;
  checkAll.value = checkedCount === messageTitles.length;
  console.log(value);
};

/** 提交按钮 */
const submit = () => {
  messageRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      // await updateUserProfile(props.user);
      proxy?.$modal.msgSuccess('修改成功');
    }
  });
};
/** 关闭按钮 */
const close = () => {
  proxy?.$tab.closePage();
};
onMounted(() => {});
</script>
