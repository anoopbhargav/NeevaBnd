export interface getQuerysetTagsInterface {
    itemsPerPage: number;
    pagenumber: number;
}

export interface getQuerysetsByTagsInterface {
    querysettagname: string;
}

export interface generateReportInterface {
    enddate: string;
    querysettagname: string;
    metrics: Array<string>;
    startdate: string;
}

export interface saveReportInterface {
    metrics: Array<string>;
    querysettagname: string;
    userid: number;
    startdate: string;
    enddate: string;
}

export interface getReportInterface {
    reportid: number;
}

export interface getSavedReportsInterface {
    itemsPerPage: number;
    pagenumber: number;
}

export interface deleteReportInterface {
    reportid: number;
}

export interface compareQuerysetsInterface {
    querysetids: Array<string>;
    pagenumber: number;
    itemsPerPage: number;
}
