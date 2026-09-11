export interface MachineStatusQuery {
  /** 兼容旧参数：单日生产日 */
  date?: string;
  /** 开始生产日（东八区当日 08:00 起） */
  startDate?: string;
  /** 结束生产日（至该日次日东八区 08:00） */
  endDate?: string;
  machines?: string;
}

export interface MachineStatusDistributionVO {
  name: string;
  status?: string;
  color: string;
  seconds: number;
  minutes: number;
  percent: number;
}

export interface MachineStatusSegmentVO {
  id: number;
  status: string;
  statusName: string;
  reason: string;
  moldId?: string;
  jobId?: string;
  operator?: string;
  fix?: string;
  eta?: string;
  color: string;
  startAt: string;
  endAt: string;
  startSecond: number;
  durationSeconds: number;
  /** 查询窗口开始处由上一条状态继承（可跨多天） */
  inherited?: boolean;
}

export interface MachineTimelineVO {
  machine: string;
  runningSeconds: number;
  totalSeconds: number;
  oee: number;
  quantity: number;
  defectiveCount: number;
  segments: MachineStatusSegmentVO[];
}

export interface MachineStatusDashboardVO {
  date: string;
  startDate: string;
  endDate: string;
  startAt: string;
  endAt: string;
  windowSeconds: number;
  reasonDistribution: MachineStatusDistributionVO[];
  statusDistribution: MachineStatusDistributionVO[];
  timelines: MachineTimelineVO[];
}
