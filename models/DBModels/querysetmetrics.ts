export interface Querysetmetrics {
    querysetmetricsid?: number;
    querysetid: number;
    querysetmetricsname: string;
    querysetmetricsdefaultparam: string | null;
    querysetmetricsdefaultparamvalue: string | null;
    querysetmetricsdefaultvalue: number | null;
    querysetmetricscontrolparam: string | null;
    querysetmetricscontrolparamvalue: string | null;
    querysetmetricscontrolvalue: number | null;
    querysetmetricsexperimentparam: string | null;
    querysetmetricsexperimentparamvalue: string | null;
    querysetmetricsexperimentvalue: number | null;
}
