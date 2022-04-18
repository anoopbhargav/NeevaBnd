export interface getQuerysetsInterface {
    itemsPerPage: number;
    pagenumber: number;
    filterValueMax?: number;
    filterValueMin?: number;
    querysettype: string;
    filterParam?: string;
    sortingOrder?: string;
    sortingParam?: string;
    searchParam?: string;
}

export interface getQueriesInterface {
    fromSideBySide: boolean;
    itemsPerPage: number;
    pagenumber: number;
    querysetid: number;
    page?: number;
    filterValueMax?: number;
    filterValueMin?: number;
    filterParam?: string;
    sortingOrder?: string;
    sortingParam?: string;
    querytags?: string;
    querytagstype?: string;
    searchParam?: string;
}

export interface getSingleSideResultsInterface {
    queryresultsid: number;
    queryside: string;
}

export interface getAllNotesInterface {
    querysetid: number;
    searchParam: string;
}

export interface addNotesInterface {
    querysetid: number;
    userid: number;
    content: string;
}

export interface getSideBySideResultsInterface {
    queryresultsidcontrol: number;
    queryresultsidexp: number;
}

export interface getSideBySideQueryResultsListInterface {
    queriesid: number;
}

export interface getQueryresultsInterface {
    itemsPerPage: number;
    pagenumber: number;
    queriesid: number;
    searchParam?: string;
}

export interface getQueryresultsListSideBySideInterface {
    searchParam: string;
    queriesid: number;
    itemsPerPage: number;
    pagenumber: number;
}
