export interface Queries {
    queriesid?: number;
    querysetid: number;
    neevalogsrequestidcontrol: string | null;
    neevalogsrequestidexperiment: string | null;
    querystring: string | null;
    querycompletedat: Date | null;
    querytaskid: string | null;
    queryuniqueid: string | null;
    queryupdatedat: Date | null;
    usercityname: string | null;
    isexclude: boolean;
    uniquekey: string;
    totalresults: number;
}
