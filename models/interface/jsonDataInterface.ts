import {
	Queries,
	Querymetrics,
	Queryratings,
	Queryresults,
	Querytags,
	Ratingsattempts,
	Resultratings,
	Resultsidemetadata,
	Sidebysideratings,
	Valuetable,
} from '../DBModels';

export interface jsonDataInterface {
    Batch: string;
    BatchCompletedAt: Date;
    BatchCreatedAt: Date;
    BatchStatus: string;
    MetricDefinitions: commontjsonDataInterface;
    QuerySetTags: Array<string>;
    SideMetadata: commontjsonDataInterface;
    RatingDefinitions: commontjsonDataInterface;
    QuerySetMetrics: Array<string>;
    Queries: Array<commontjsonDataInterface>;
    value: boolean;
    Bool: boolean;
    Float: number;
    String: string;
    eachMetrics: commontjsonDataInterface;
    eachRatings: commontjsonDataInterface;
    Name: string;
    AggregatedValue: commontjsonDataInterface;
    Attempts: Array<string>;
    Override: valuesInterface;
    eachAttempt: commontjsonDataInterface;
    Default: commontjsonDataInterface;
    Control: commontjsonDataInterface;
    Experiment: commontjsonDataInterface;
}

class commontjsonDataInterface {
	PrimaryMetric: string;
	length: number;
	QueryMetrics: commontjsonDataInterface;
	QueryRatings: commontjsonDataInterface;
	QueryResults: commontjsonDataInterface;
	NeevaLogsRequestID: commontjsonDataInterface;
	Control: string;
	Experiment: string;
	Query: string;
	QueryCompletedAt: Date;
	QueryTaskId: string;
	QueryUniqueId: string;
	QueryUpdatedAt: Date;
	UserCityName: string;
	QueryTags: Array<string>;
	QueryControlTags: Array<string>;
	QueryExperimentTags: Array<string>;
	String: string;
	Bool: boolean;
	Float: number;
	Value: valuesInterface;
}

export interface valuesInterface {
    Bool?: boolean;
    Float?: number;
    String?: string;
}

export interface parallelInsertionInterface {
    valueTableDataToInsert: Valuetable;
    queriesDataToInsert: Queries;
    queryMetricsDataToInsert: Querymetrics;
    allAttemptsDataToInsert: Ratingsattempts;
    queryRatingsDataToInsert: Queryratings;
    sidebysideRatingsDataToInsert: Sidebysideratings;
    queryResultsDataToInsert: Queryresults;
    resultRatingDataToInsert: Resultratings;
    resultSideMetaDataToInsert: Resultsidemetadata;
    queryTagsDataToInsert: Querytags;
}
