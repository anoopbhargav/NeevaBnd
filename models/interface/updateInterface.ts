export interface updateQuerysetMetricInterface {
    querysetid: number;
    querysetmetricname: string;
}

export interface deleteQuerysetInterface {
    querysetid: number;
}

export interface updateSideBySideRatingInterface {
    sidebysideratingsid: number;
    queriesid: number;
    rating: string;
}

export interface singleSideResultsWithRatingsInterface {
    queryresultsid: number;
    queryside: string;
}

export interface excludeQueryInterface {
    isexclude: boolean;
    queriesid: number;
}

export interface updateRatingInterface {
    overridevalue: number;
    value: number;
    ratingName: string;
    ratingtype: string;
}
