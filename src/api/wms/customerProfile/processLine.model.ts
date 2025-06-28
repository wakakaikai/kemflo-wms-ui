export interface YAxisItem {
    measurePointCode: string;
    name: string;
    unit: string;
    prop: string;
    code?: string;
    keyMonitoringFlag: number; // 1 重点监测 0 非重点监测
    data: Array<number | string | null>;
}
export interface ProcessLineChartMeasurePointItem extends YAxisItem {
    axisPosition?: string;
}

export interface ProcessLineChartPropData {
    xAxisData: Array<string>;
    yAxis: Array<YAxisItem>;
    yAxisList?: Array<Array<YAxisItem>>;
    setDefault: boolean;
    errDataIndexList?: Array<any>;
}

export interface ProcessLineNodeItem {
    name: string;
    seriesId: string;
    seriesIndex: number;
    seriesName: string;
    value: number;
    data: number;
    dataIndex: number;
}
