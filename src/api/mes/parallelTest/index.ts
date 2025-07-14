// api/mes/parallelTest/index.ts
import request from '@/utils/request';
// 原有API基础上新增并行测试支持
export function useParallelTestApi() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 获取产品当前测试会话
  const getActiveSessions = async (productId: string) => {
    try {
      loading.value = true;
      const response = await request.get(`/test-sessions/${productId}`);
      return response.data;
    } catch (err) {
      error.value = '获取测试会话失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 保存测试结果 (带测试员ID)
  const saveTestResult = async (productId: string, testerId: string, testId: string, value: any) => {
    try {
      loading.value = true;
      await request.post(`/test-sessions/${productId}/${testerId}/results`, {
        testId,
        value
      });
    } catch (err) {
      error.value = '保存测试结果失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 锁定测试项 (防止并发编辑)
  const lockTestItem = async (productId: string, testerId: string, testId: string) => {
    try {
      await request.post(`/test-locks/${productId}/${testId}`, {
        testerId
      });
    } catch (err) {
      throw new Error('测试项被其他测试员锁定');
    }
  };

  return {
    loading,
    error,
    getActiveSessions,
    saveTestResult,
    lockTestItem
    // 其他原有API...
  };
}
