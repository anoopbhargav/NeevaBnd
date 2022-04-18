export interface Report {
    reportid?: number;
    querysettagname: string;
    startdate: string | null;
    enddate: string | null;
    querysetmetricsname: string;
    userid: number;
    savedon: Date;
    uniquekey: string;
    isactive: boolean;
}
