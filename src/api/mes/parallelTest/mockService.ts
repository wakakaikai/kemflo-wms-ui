// src/services/mockService.ts
import type { TestConfig, TestGroup, TestItem, EmployeeTest } from '@/types/testConfig';

// 模拟产品列表
const mockProducts = [
  { id: 'AYP70', name: '博世AYP70款' },
  { id: 'BQP80', name: '博世BQP80款' },
  { id: 'CXR90', name: '博世CXR90款' }
];

// 模拟测试配置
const mockTestConfig: TestConfig = {
  productId: 'AYP70',
  productName: '博世AYP70款',
  testGroups: [
    {
      groupId: 'flush',
      groupName: '冲洗测试',
      description: '首次上电冲洗测试',
      parallel: false,
      required: true,
      tests: [
        {
          testId: 'flush_time',
          testName: '冲洗时间',
          description: '首次上电冲洗时间(分钟)',
          inputType: 'number',
          defaultValue: 27,
          minValue: 0,
          maxValue: 60,
          unit: '分钟',
          required: true
        },
        {
          testId: 'flush_status',
          testName: '冲洗状态',
          description: '冲洗是否正常完成',
          inputType: 'checkbox',
          defaultValue: false,
          required: true
        }
      ]
    },
    {
      groupId: 'temperature',
      groupName: '温度测试',
      description: '不同模式下的温度测试',
      parallel: true,
      required: true,
      tests: [
        {
          testId: 'temp_normal_150',
          testName: '常温150ml温度',
          inputType: 'number',
          defaultValue: 0,
          unit: '℃',
          required: true
        },
        {
          testId: 'temp_normal_300',
          testName: '常温300ml温度',
          inputType: 'number',
          defaultValue: 0,
          unit: '℃',
          required: true
        },
        {
          testId: 'temp_milk_150',
          testName: '奶粉模式150ml温度',
          description: '奶粉模式(45±3℃)',
          inputType: 'number',
          defaultValue: 0,
          unit: '℃',
          required: true
        }
      ]
    },
    {
      groupId: 'factory',
      groupName: '厂测模式',
      parallel: true,
      required: false,
      tests: [
        {
          testId: 'sensor_check',
          testName: '传感器检测',
          inputType: 'select',
          defaultValue: 'ok',
          options: [
            { label: '正常', value: 'ok' },
            { label: '异常', value: 'error' }
          ],
          required: true
        },
        {
          testId: 'display_check',
          testName: '显示检测',
          description: '检查所有显示是否正常',
          inputType: 'checkbox',
          defaultValue: false,
          required: true
        }
      ]
    }
  ]
};

// 模拟用户数据
const mockUser = {
  id: 'user001',
  name: '张三',
  employeeId: 'EMP2023001',
  department: '质量检测部'
};

// 模拟API接口
export const mockApi = {
  getProducts: (): Promise<Array<{ id: string; name: string }>> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockProducts), 500);
    });
  },

  getTestConfig: (productId: string): Promise<TestConfig> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...mockTestConfig,
          productId,
          productName: mockProducts.find((p) => p.id === productId)?.name || '未知产品'
        });
      }, 500);
    });
  },

  startTest: (productId: string, employeeName: string, machineId?: string): Promise<EmployeeTest> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          employeeId: `test-${Date.now()}`,
          employeeName,
          productId,
          machineId,
          startTime: new Date().toISOString(),
          results: {},
          progress: {}
        });
      }, 500);
    });
  },

  saveTestResult: (testId: string, itemId: string, value: any): Promise<void> => {
    console.log('模拟保存测试结果:', { testId, itemId, value });
    return Promise.resolve();
  },

  submitTest: (testId: string): Promise<void> => {
    console.log('模拟提交测试:', testId);
    return Promise.resolve();
  }
};
