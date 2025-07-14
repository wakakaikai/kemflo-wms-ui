export interface TestConfig {
  productId: string;
  productName: string;
  testGroups: TestGroup[];
}

export interface TestGroup {
  groupId: string;
  groupName: string;
  description?: string;
  parallel: boolean;
  required: boolean;
  tests: TestItem[];
}

export interface TestItem {
  testId: string;
  testName: string;
  description?: string;
  inputType: 'number' | 'text' | 'select' | 'checkbox' | 'custom';
  defaultValue: any;
  minValue?: number;
  maxValue?: number;
  options?: { label: string; value: any }[];
  unit?: string;
  required: boolean;
  customComponent?: string;
}

export interface TestResult {
  [testId: string]: any;
}

export interface TestProgress {
  [groupId: string]: {
    completed: boolean;
    progress: number;
  };
}

export interface EmployeeTest {
  employeeId: string;
  employeeName: string;
  productId: string;
  machineId?: string;
  startTime: string;
  endTime?: string;
  results: TestResult;
  progress: TestProgress;
}

export interface User {
  id: string;
  name: string;
  employeeId: string;
  department?: string;
}
