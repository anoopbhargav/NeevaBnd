export interface Querysetdetails {
    querysetid?: number;
    querysettype: string;
    batch: string | null;
    batchcompletedat: Date | null;
    batchcreatedat: Date | null;
    batchstatus: string | null;
    metricdefinitions_primarymetric: string | null;
    importedon: Date;
    savedfilename: string;
    originalfilename: string;
    is_active: boolean;
    importedby: number;
    uniquekey: string;
    querysetdescription: string;
    imports3path: string;
}
