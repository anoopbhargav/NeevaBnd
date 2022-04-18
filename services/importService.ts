const moment = require('moment');

const pgp = require('pg-promise')({
	capSQL: true,
});

import { PreparedStatement } from 'pg-promise';
import { getConnection } from '../db';

import {
	Querysetdetails,
	Querysetmetrics,
	Valuetable,
	Queries,
	Querymetrics,
	Queryratings,
	Ratingsattempts,
	Queryresults,
	Resultsidemetadata,
	Resultratings,
	Querysetsidemetadata,
	Querysetratingscales,
	Querysettags,
	Sidebysideratings,
	Querytags,
} from '../models/DBModels/index';
import { importQuerySetsInterface } from '../models/interface/importInterface';
import {
	jsonDataInterface,
	parallelInsertionInterface,
	valuesInterface,
} from '../models/interface/jsonDataInterface';
import { commonReqResInterface } from '../models/interface/commonReqResInterface';

import {
	csAttempts,
	csQueries,
	csQuerymetrics,
	csQueryratings,
	csQueryresults,
	csResultratings,
	csResultsidemetadata,
	csValuetable,
	csSidebysideratings,
	csQuerytags,
} from '../helpers/databaseStructure';

let querysetId: number;

let queriesDataToInsert: Array<Queries> = [];
let queriesID = 0;

let queryMetricsDataToInsert: Array<Querymetrics> = [];
let sidebysideRatingsDataToInsert: Array<Sidebysideratings> = [];

let allAttemptsDataToInsert: Array<Ratingsattempts> = [];
let ratingAttemptsID = 0;

let queryRatingsDataToInsert: Array<Queryratings> = [];
let queryRatingID = 0;
let sidebysideratingsID = 0;

let queryResultsDataToInsert: Array<Queryresults> = [];
let queryResultID = 0;

let resultRatingDataToInsert: Array<Resultratings> = [];
let resultRatingID = 0;

let resultSideMetaDataToInsert: Array<Resultsidemetadata> = [];

let valueTableDataToInsert: Array<Valuetable> = [];
let valueTableID = 0;

let queryTagsDataToInsert: Array<Querytags> = [];
let queryTagsID = 0;

let totalResultLength = 0;

let preparedStatementUniqueName = 0;

export const loadJsonDataToDataBase = async (
	jsonData: jsonDataInterface,
	errorMessageToReturn: string,
	originalFileName: string,
	savedFileName: string,
	loadJsonDataToDataBaseData: importQuerySetsInterface,
	res: commonReqResInterface
) => {
	const { filename, querysetdescription, querysettype, tags, userid } =
        loadJsonDataToDataBaseData;
	valueTableDataToInsert = []; //clear all the inserted data
	queriesDataToInsert = [];
	queryMetricsDataToInsert = [];
	sidebysideRatingsDataToInsert = [];
	allAttemptsDataToInsert = [];
	queryRatingsDataToInsert = [];
	queryResultsDataToInsert = [];
	resultRatingDataToInsert = [];
	resultSideMetaDataToInsert = [];
	queryTagsDataToInsert = [];

	let flag = true;
	let queryRatingScale = {};
	let resultRatingScale = {};
	const s3Path = originalFileName;
	originalFileName = originalFileName.replace(/.+\//, '');

	const db = await getConnection();

	try {
		const prepareValueTableID = new PreparedStatement({
			name: `import-${preparedStatementUniqueName}-selectValueTableID`,
			text: 'SELECT MAX(valuetableid) FROM valuetable',
		});
		const getValueTableID = await db.one(prepareValueTableID);
		preparedStatementUniqueName += 1;
		valueTableID = getValueTableID.max;
		if (valueTableID === null) {
			valueTableID = 0;
		}

		const prepareQueriesID = new PreparedStatement({
			name: `import-${preparedStatementUniqueName}-selectQueriesID`,
			text: 'SELECT MAX(queriesid) FROM queries',
		});
		const getQueriesID = await db.one(prepareQueriesID);
		preparedStatementUniqueName += 1;
		queriesID = getQueriesID.max;
		if (queriesID === null) {
			queriesID = 0;
		}

		const prepareQueryRatingsID = new PreparedStatement({
			name: `import-${preparedStatementUniqueName}-queryRatingsID`,
			text: 'SELECT MAX(queryratingsid) FROM queryratings',
		});
		const getQueryRatingID = await db.one(prepareQueryRatingsID);
		preparedStatementUniqueName += 1;
		queryRatingID = getQueryRatingID.max;
		if (queryRatingID === null) {
			queryRatingID = 0;
		}

		const prepareSidyBySideRatinsID = new PreparedStatement({
			name: `import-${preparedStatementUniqueName}-selectSideBySideRatingsID`,
			text: 'SELECT MAX(sidebysideratingsid) FROM sidebysideratings',
		});
		const getSidebysideratingsID = await db.one(prepareSidyBySideRatinsID);
		preparedStatementUniqueName += 1;
		sidebysideratingsID = getSidebysideratingsID.max;
		if (sidebysideratingsID === null) {
			sidebysideratingsID = 0;
		}

		const prepareSelectQueryResultsID = new PreparedStatement({
			name: `import-${preparedStatementUniqueName}-selectQueryResultsID`,
			text: 'SELECT MAX(queryresultsid) from queryresults',
		});
		const getQueryResultID = await db.one(prepareSelectQueryResultsID);
		preparedStatementUniqueName += 1;
		queryResultID = getQueryResultID.max;
		if (queryResultID === null) {
			queryResultID = 0;
		}

		const prepareSelectResultRatingsID = new PreparedStatement({
			name: `import-${preparedStatementUniqueName}-selectResultRatingsID`,
			text: 'SELECT MAX(resultratingsid) from resultratings',
		});
		const getResultRatingID = await db.one(prepareSelectResultRatingsID);
		preparedStatementUniqueName += 1;
		resultRatingID = getResultRatingID.max;
		if (resultRatingID === null) {
			resultRatingID = 0;
		}

		const prepareSelectRatingAttemptsID = new PreparedStatement({
			name: `import-${preparedStatementUniqueName}-selectRatingsAttemptID`,
			text: 'SELECT MAX(ratingsattemptsid) from ratingsattempts',
		});
		const getRatingAttemptsID = await db.one(prepareSelectRatingAttemptsID);
		preparedStatementUniqueName += 1;
		ratingAttemptsID = getRatingAttemptsID.max;
		if (ratingAttemptsID === null) {
			ratingAttemptsID = 0;
		}

		const prepareSelectQueryTagID = new PreparedStatement({
			name: `import-${preparedStatementUniqueName}-selectQueryTagID`,
			text: 'SELECT MAX(querytagid) from querytags',
		});
		const getQueryTagsID = await db.one(prepareSelectQueryTagID);
		preparedStatementUniqueName += 1;
		queryTagsID = getQueryTagsID.max;
		if (queryTagsID === null) {
			queryTagsID = 0;
		}

		//================Start==============================//
		if (filename) {
			originalFileName = filename;
		}
		const querySetUnique: string =
            moment().valueOf() +
            Math.floor(1000 + Math.random() * 9000).toString();
		const querysetData: Querysetdetails = {
			querysettype: querysettype,
			batch: !('Batch' in jsonData) ? null : jsonData.Batch,
			batchcompletedat: !('BatchCompletedAt' in jsonData)
				? null
				: jsonData.BatchCompletedAt,
			batchcreatedat: !('BatchCreatedAt' in jsonData)
				? null
				: jsonData.BatchCreatedAt,
			batchstatus: !('BatchStatus' in jsonData)
				? null
				: jsonData.BatchStatus,
			metricdefinitions_primarymetric: !('MetricDefinitions' in jsonData)
				? null
				: jsonData.MetricDefinitions.PrimaryMetric,
			importedon: new Date(),
			savedfilename: savedFileName,
			originalfilename: originalFileName,
			is_active: true,
			uniquekey: querySetUnique,
			importedby: userid ? userid : 0,
			querysetdescription: querysetdescription,
			imports3path: s3Path,
		};

		//================ querysetdetails=====================//
		await insertQuerysetDetails(querysetData, querySetUnique);

		//==================Querysettags=====================//
		if ('QuerySetTags' in jsonData && jsonData.QuerySetTags?.length > 0) {
			await insertQuerySetTags();
		}

		//if tags are passed from the UI
		if (tags?.length > 0) {
			await insertQuerySetTagsFromUI();
		}

		//==================querysetsidemetadata===============//
		if (
			'SideMetadata' in jsonData &&
            jsonData.SideMetadata &&
            Object.keys(jsonData.SideMetadata)?.length > 0
		) {
			await insertQuerySetSideMetaData();
		}
		//===================querysetsidemetadata ENDS==============//

		//===================querysetratingscales====================//
		if (
			'RatingDefinitions' in jsonData &&
            jsonData.RatingDefinitions &&
            Object.keys(jsonData.RatingDefinitions)?.length > 0
		) {
			await insertRatingDefinitions();
		}
		//===================querysetratingscales ENDS================//

		//================== querysetmetrics =====================//
		if (
			'QuerySetMetrics' in jsonData &&
            jsonData.QuerySetMetrics?.length > 0
		) {
			await insertQuerySetMetrics();
		} else {
			await dummyQuerySetMetrics();
		}

		//========================ENDS===================================//

		//========================queries=================================//
		let queryNumber = 0;
		let totalNumberOfQuery = 0;
		const totalQueryNumberToIncrease = 70;
		const totalQueryNumberString = 'seventyQueries=>';
		if (
			'Queries' in jsonData &&
            jsonData.Queries &&
            jsonData.Queries.length > 0
		) {
			//console.time("Queries=>");
			totalNumberOfQuery = jsonData.Queries.length;
			for (const eachQuery of jsonData.Queries) {
				queryNumber = +queryNumber + +1;
				if (
					Number(queryNumber) % totalQueryNumberToIncrease === 0 ||
                    queryNumber === totalNumberOfQuery
				) {
					console.time(totalQueryNumberString);
				}
				try {
					const queryUnique =
                        moment().valueOf() +
                        Math.floor(1000 + Math.random() * 9000).toString();

					queriesID = Number(Number(queriesID) + 1);

					//==================each query querymetrics============//
					if (
						'QueryMetrics' in eachQuery &&
                        eachQuery.QueryMetrics?.length > 0
					) {
						insertQueryMetrics(eachQuery, queryNumber);
					} else {
						insertDummyNDCGQueryMetrics();
					}
					//===============ENDS each query querymetrics===========//

					//=================each query queryratings================//
					if (
						'QueryRatings' in eachQuery &&
                        eachQuery.QueryRatings?.length > 0
					) {
						insertQueryRatings(eachQuery, queryNumber);
					} else {
						dummyQueryRatings();
					}
					//==================ENDS each query queryratings================//

					//====================== each query queryresults=================//
					if (
						'QueryResults' in eachQuery &&
                        eachQuery.QueryResults?.length > 0
					) {
						insertQueryResults(eachQuery, queryNumber);
					}

					const queriesData: Queries = {
						queriesid: queriesID,
						querysetid: querysetId,
						neevalogsrequestidcontrol:
                            'NeevaLogsRequestID' in eachQuery &&
                            eachQuery['NeevaLogsRequestID'] !== null &&
                            'Control' in eachQuery['NeevaLogsRequestID']
                            	? eachQuery.NeevaLogsRequestID.Control
                            	: null,
						neevalogsrequestidexperiment:
                            'NeevaLogsRequestID' in eachQuery &&
                            eachQuery['NeevaLogsRequestID'] !== null &&
                            'Experiment' in eachQuery['NeevaLogsRequestID']
                            	? eachQuery.NeevaLogsRequestID.Experiment
                            	: null,
						querystring: !('Query' in eachQuery)
							? null
							: eachQuery.Query,
						querycompletedat: !('QueryCompletedAt' in eachQuery)
							? null
							: eachQuery.QueryCompletedAt,
						querytaskid: !('QueryTaskId' in eachQuery)
							? null
							: eachQuery.QueryTaskId,
						queryuniqueid: !('QueryUniqueId' in eachQuery)
							? null
							: eachQuery.QueryUniqueId,
						queryupdatedat: !('QueryUpdatedAt' in eachQuery)
							? null
							: eachQuery.QueryUpdatedAt,
						usercityname: !('UserCityName' in eachQuery)
							? null
							: eachQuery.UserCityName,
						isexclude: false,
						uniquekey: queryUnique,
						totalresults:
                            queryResultsDataToInsert.length - totalResultLength,
					};
					queriesDataToInsert.push(queriesData);
					totalResultLength = queryResultsDataToInsert.length;
					//======================== ENDS each query queryresults==============//

					//========================  each query QueryTagsName==============//
					if (
						'QueryTags' in eachQuery &&
                        eachQuery.QueryTags?.length > 0
					) {
						eachQuery.QueryTags.map((eachtagname) => {
							queryTagsID = Number(Number(queryTagsID) + 1);
							const querytagsdata: Querytags = {
								querytagid: queryTagsID,
								queriesid: queriesID,
								querytagname: eachtagname,
								querytagtype: 'default',
							};
							queryTagsDataToInsert.push(querytagsdata);
						});
					}

					if (
						'QueryControlTags' in eachQuery &&
                        eachQuery.QueryControlTags?.length > 0
					) {
						eachQuery.QueryControlTags.map((eachtagname) => {
							queryTagsID = Number(Number(queryTagsID) + 1);
							const querytagsdata: Querytags = {
								querytagid: queryTagsID,
								queriesid: queriesID,
								querytagname: eachtagname,
								querytagtype: 'control',
							};
							queryTagsDataToInsert.push(querytagsdata);
						});
					}

					if (
						'QueryExperimentTags' in eachQuery &&
                        eachQuery.QueryExperimentTags?.length > 0
					) {
						eachQuery.QueryExperimentTags.map((eachtagname) => {
							queryTagsID = Number(Number(queryTagsID) + 1);
							const querytagsdata: Querytags = {
								querytagid: queryTagsID,
								queriesid: queriesID,
								querytagname: eachtagname,
								querytagtype: 'experiment',
							};
							queryTagsDataToInsert.push(querytagsdata);
						});
					}
					//======================== ENDS each query QueryTagsName==============//
				} catch (err) {
					flag = false;
					console.log('err queriesdata', err);
					errorMessageToReturn +=
                        '<br /> error parsing queriesdata from query ' +
                        queryNumber +
                        ' +/- 50 : ' +
                        err.message
                        	? err.message
                        	: err;
				}

				if (
					Number(queryNumber) % totalQueryNumberToIncrease === 0 ||
                    queryNumber === totalNumberOfQuery
				) {
					try {
						console.time('sqlExecution=>');
						console.log('Stating sql execution');
						totalResultLength = 0;
						const parallelInsertion: Array<parallelInsertionInterface> =
                            [];
						await insertAllSQLExecutionData(parallelInsertion);
						try {
							await Promise.all(parallelInsertion);
						} catch (err) {
							const errMsg = `err inserting query ( queryNumber /- 10) : ${
								err.message ? err.message : err
							}`;
							console.log(errMsg);
							flag = false;
							errorMessageToReturn += '<br/>' + errMsg;
						}
						console.timeEnd('sqlExecution=>');
					} catch (err) {
						console.log('err in query execution', err);
						flag = false;
						errorMessageToReturn +=
                            '<br /> err in query execution : ' + err.message
                            	? err.message
                            	: err;
					}
					valueTableDataToInsert = []; //clear all the inserted data
					queriesDataToInsert = [];
					queryMetricsDataToInsert = [];
					allAttemptsDataToInsert = [];
					queryRatingsDataToInsert = [];
					sidebysideRatingsDataToInsert = [];
					queryResultsDataToInsert = [];
					resultRatingDataToInsert = [];
					resultSideMetaDataToInsert = [];
					queryTagsDataToInsert = [];
					console.timeEnd(totalQueryNumberString);
					console.log(
						'Completed importing queries till : ' + queryNumber
					);
				}
			}
			//console.timeEnd("Queries=>");
		}

		if (process.env.IS_DEBUGGING_ON) {
			await logImportedData(querysetId, userid, db);
		}

		if (flag == true) {
			res.status(200).json({
				status: 200,
				message: 'QuerySet imported',
				querysetid: querysetId,
			});
		} else {
			res.status(500).json({
				status: 500,
				message: errorMessageToReturn,
			});
		}
	} catch (err) {
		flag = false;
		console.log('error', err);
		res.status(500).json({
			status: 500,
			message: 'error' + err.message ? err.message : err,
		});
	}

	function dummyResultRating() {
		const resultRatingsUnique =
            moment().valueOf() +
            Math.floor(1000 + Math.random() * 9000).toString();

		// aggregatedvalue
		valueTableID = Number(Number(valueTableID) + 1);
		insertValueTable(valueTableID, { Float: 0.0 });
		const aggregatedvalueID = valueTableID;

		// overridevalue
		valueTableID = Number(Number(valueTableID) + 1);
		insertValueTable(valueTableID, null);
		const overrideValueID = valueTableID;

		resultRatingID = Number(Number(resultRatingID) + 1);
		const resultRatingsData: Resultratings = {
			resultratingsid: resultRatingID,
			queryresultsid: queryResultID,
			aggregatedvalue: aggregatedvalueID,
			overridevalue: overrideValueID,
			resultratingname: 'rating',
			ratingscale: 5,
			ratingtype: 'Float',
			uniquekey: resultRatingsUnique,
		};
		resultRatingDataToInsert.push(resultRatingsData);
	}

	async function dummyQuerySetMetrics() {
		let defaultValueID = null,
			controlValueID = null,
			experimentValueID = null;

		//for Default
		valueTableID = Number(Number(valueTableID) + 1);
		insertValueTable(valueTableID, null);
		defaultValueID = valueTableID;

		//for Control
		valueTableID = Number(Number(valueTableID) + 1);
		insertValueTable(valueTableID, null);
		controlValueID = valueTableID;

		//for Experiment
		valueTableID = Number(Number(valueTableID) + 1);
		insertValueTable(valueTableID, null);
		experimentValueID = valueTableID;
		const prepareDummyQuerysetMetrics = new PreparedStatement({
			name: `import-${preparedStatementUniqueName}-dummyQuerySetMetrics`,
			text: 'INSERT INTO querysetmetrics (querysetid, \
        querysetmetricsname, \
        querysetmetricsdefaultparam, \
        querysetmetricsdefaultparamvalue, \
        querysetmetricsdefaultvalue, \
        querysetmetricscontrolparam, \
        querysetmetricscontrolparamvalue, \
        querysetmetricscontrolvalue, \
        querysetmetricsexperimentparam, \
        querysetmetricsexperimentparamvalue, \
        querysetmetricsexperimentvalue) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
			values: [
				querysetId,
				'avg_ndcg',
				null,
				null,
				defaultValueID,
				null,
				null,
				controlValueID,
				null,
				null,
				experimentValueID,
			],
		});
		await db.none(prepareDummyQuerysetMetrics);
		preparedStatementUniqueName += 1;
	}

	function dummyQueryRatings() {
		const queryRatingUnique =
            moment().valueOf() +
            Math.floor(1000 + Math.random() * 9000).toString();
		let aggregatedValueID = null;
		let overrideValueID = null;

		//for Aggregated Value
		valueTableID = Number(Number(valueTableID) + 1);
		insertValueTable(valueTableID, null);
		aggregatedValueID = valueTableID;

		//for Override value
		valueTableID = Number(Number(valueTableID) + 1);
		insertValueTable(valueTableID, null);
		overrideValueID = valueTableID;

		//aggregated value
		queryRatingID = Number(Number(queryRatingID) + 1);
		const queryRatingsData: Queryratings = {
			queryratingsid: queryRatingID,
			queriesid: queriesID,
			aggregatedvalue: aggregatedValueID,
			overridevalue: overrideValueID,
			queryratingname: 'compare_A_B',
			ratingscale: 5,
			ratingtype: 'Float',
			uniquekey: queryRatingUnique,
		};
		queryRatingsDataToInsert.push(queryRatingsData);

		//added sidebysiderating
		sidebysideratingsID = Number(Number(sidebysideratingsID) + 1);
		const querySideBySideRating: Sidebysideratings = {
			sidebysideratingsid: sidebysideratingsID,
			queriesid: queriesID,
			ratingtext: null,
		};
		sidebysideRatingsDataToInsert.push(querySideBySideRating);
	}

	async function insertQuerysetDetails(
		querysetData: Querysetdetails,
		querySetUnique: string
	) {
		const prepareQuerySetDetails = new PreparedStatement({
			name: `import-${preparedStatementUniqueName}-querySetDetailsData`,
			text: 'INSERT INTO querysetdetails (querysettype, \
          batch, \
          batchcompletedat, \
          batchcreatedat, \
          batchstatus, \
          metricdefinitions_primarymetric, \
          importedon, \
          savedfilename, \
          originalfilename, \
          is_active, \
          uniquekey, \
          importedby, \
          querysetdescription, \
          imports3path ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',
			values: [
				querysetData.querysettype,
				querysetData.batch,
				querysetData.batchcompletedat,
				querysetData.batchcreatedat,
				querysetData.batchstatus,
				querysetData.metricdefinitions_primarymetric,
				querysetData.importedon,
				querysetData.savedfilename,
				querysetData.originalfilename,
				querysetData.is_active,
				querysetData.uniquekey,
				querysetData.importedby,
				querysetData.querysetdescription,
				querysetData.imports3path,
			],
		});
		let querysetID = await db.none(prepareQuerySetDetails);
		preparedStatementUniqueName += 1;
		const prepareSelectQuerySetID = new PreparedStatement({
			name: `import-${preparedStatementUniqueName}-selectQuerySetID`,
			text: 'SELECT querysetid FROM querysetdetails where uniquekey=$1',
			values: [querySetUnique],
		});
		querysetID = await db.one(prepareSelectQuerySetID);
		preparedStatementUniqueName += 1;
		querysetId = querysetID.querysetid;
	}

	async function insertQuerySetTags() {
		const querysettags = [];
		const waitForProcessToComplete = jsonData.QuerySetTags.map(
			async (eachTag) => {
				try {
					const querysettagData: Querysettags = {
						querysetid: querysetId,
						querysettagname: eachTag,
					};
					querysettags.push(querysettagData);

					const prepareQuerySetTagsData = new PreparedStatement({
						name: `import-${preparedStatementUniqueName}-querySetTagsData`,
						text: 'INSERT INTO querysettags (querysetid,querysettagname) VALUES ($1,$2)',
						values: [
							querysettagData.querysetid,
							querysettagData.querysettagname,
						],
					});
					await db.none(prepareQuerySetTagsData);
					preparedStatementUniqueName += 1;
				} catch (err) {
					console.log('err QuerySetTags', err);
					flag = false;
					errorMessageToReturn +=
                        '<br /> error inserting QuerySetTags : ' + err.message
                        	? err.message
                        	: err;
				}
			}
		);
		await Promise.all([waitForProcessToComplete]);
	}

	async function insertQuerySetTagsFromUI() {
		const querysettags = [];
		const tagsFromUI = tags.split(',');
		if (tagsFromUI.length > 0) {
			const waitForProcessToComplete = tagsFromUI.map(async (eachTag) => {
				try {
					const querysettagData: Querysettags = {
						querysetid: querysetId,
						querysettagname: eachTag,
					};
					querysettags.push(querysettagData);

					const prepareQuerySetTagsUIData = new PreparedStatement({
						name: `import-${preparedStatementUniqueName}-querySetTagsData-UI`,
						text: 'INSERT INTO querysettags (querysetid,querysettagname) VALUES ($1, $2)',
						values: [
							querysettagData.querysetid,
							querysettagData.querysettagname,
						],
					});
					await db.none(prepareQuerySetTagsUIData);
					preparedStatementUniqueName += 1;
				} catch (err) {
					console.log('err QuerySetTags', err);
					flag = false;
					errorMessageToReturn +=
                        '<br /> error inserting QuerySetTags : ' + err.message
                        	? err.message
                        	: err;
				}
			});
			await Promise.all([waitForProcessToComplete]);
		}
	}

	async function insertQuerySetSideMetaData() {
		const sidemetadataArr = [];
		const waitForProcessToComplete = Object.keys(jsonData.SideMetadata).map(
			async (metadata: string) => {
				try {
					const querysetsidemetaData: Querysetsidemetadata = {
						querysetid: querysetId,
						sidemetadatatype: metadata,
						sidemetadatadocsignals:
                            jsonData.SideMetadata[metadata] === null
                            	? null
                            	: jsonData.SideMetadata[metadata].DocSignals,
						sidemetadatarank:
                            jsonData.SideMetadata[metadata] === null
                            	? null
                            	: jsonData.SideMetadata[metadata].Rank,
					};

					sidemetadataArr.push(querysetsidemetaData);
					const prepraeSidemetataData = new PreparedStatement({
						name: `import-${preparedStatementUniqueName}-insertSideMetataData`,
						text: 'INSERT INTO querysetsidemetadata ( querysetid, \
            sidemetadatatype, \
            sidemetadatadocsignals, \
            sidemetadatarank) VALUES ($1,$2,$3,$4)',
						values: [
							querysetsidemetaData.querysetid,
							querysetsidemetaData.sidemetadatatype,
							querysetsidemetaData.sidemetadatadocsignals,
							querysetsidemetaData.sidemetadatarank,
						],
					});
					await db.none(prepraeSidemetataData);
					preparedStatementUniqueName += 1;
				} catch (err) {
					console.log('err querysetsidemetadata', err);
					flag = false;
					errorMessageToReturn +=
                        '<br /> error inserting querysetsidemetadata : ' +
                        err.message
                        	? err.message
                        	: err;
				}
			}
		);
		await Promise.all([waitForProcessToComplete]);
	}

	async function insertRatingDefinitions() {
		const ratingScalesArr = [];
		const waitForProcessToComplete = Object.keys(
			jsonData.RatingDefinitions
		).map(async (scalesData: string) => {
			try {
				if (scalesData === 'QueryRatingScales') {
					queryRatingScale = jsonData.RatingDefinitions[scalesData];
				}
				if (scalesData === 'ResultRatingScales') {
					resultRatingScale = jsonData.RatingDefinitions[scalesData];
				}
				if (
					jsonData.RatingDefinitions[scalesData] &&
                    Object.keys(jsonData.RatingDefinitions[scalesData])
                    	?.length > 0
				) {
					const waitForProcessToComplete1 = Object.keys(
						jsonData.RatingDefinitions[scalesData]
					).map(async (eachScale: string) => {
						if (jsonData.RatingDefinitions[scalesData][eachScale]) {
							const querysetRatingScalesData: Querysetratingscales =
                                {
                                	querysetid: querysetId,
                                	ratingtype: scalesData,
                                	ratingkey: eachScale,
                                	ratingvalue:
                                        jsonData.RatingDefinitions[scalesData][
                                        	eachScale
                                        ],
                                };

							ratingScalesArr.push(querysetRatingScalesData);
							const prepareInsertQueryRatingScalesData =
                                new PreparedStatement({
                                	name: `import-${preparedStatementUniqueName}-querySetRatingScale`,
                                	text: 'INSERT INTO querysetratingscales ( querysetid, \
                    ratingtype, \
                    ratingkey, \
                    ratingvalue) VALUES ($1,$2,$3,$4)',
                                	values: [
                                		querysetRatingScalesData.querysetid,
                                		querysetRatingScalesData.ratingtype,
                                		querysetRatingScalesData.ratingkey,
                                		querysetRatingScalesData.ratingvalue,
                                	],
                                });
							await db.none(prepareInsertQueryRatingScalesData);
							preparedStatementUniqueName += 1;
						}
					});
					await Promise.all(waitForProcessToComplete1);
				}
			} catch (err) {
				console.log('err querysetratingscales', err);
				flag = false;
				errorMessageToReturn +=
                    '<br /> error inserting querysetratingscales : ' +
                    err.message
                    	? err.message
                    	: err;
			}
		});
		await Promise.all([waitForProcessToComplete]);
	}

	async function insertQuerySetMetrics() {
		const querysetMetricsArr = [];
		//console.time("querysetmetrics=>");
		let isAvgNdcg = false;
		const waitForProcessToComplete = jsonData.QuerySetMetrics.map(
			async (eachMetrics: any) => {
				try {
					if (eachMetrics.Name === 'avg_ndcg') {
						isAvgNdcg = true;
					}
					let defaultValueID = null,
						controlValueID = null,
						experimentValueID = null,
						defaultParam = null,
						defaultParamValue = null,
						controlParam = null,
						controlParamValue = null,
						experimentParam = null,
						experimentParamValue = null;

					if (eachMetrics.Default && eachMetrics.Default.Value) {
						valueTableID = Number(Number(valueTableID) + 1);
						insertValueTable(
							valueTableID,
							eachMetrics.Default.Value
						);
						defaultValueID = valueTableID;
						defaultParam =
                            Object.keys(eachMetrics.Default)?.length > 0
                            	? Object.keys(eachMetrics.Default)[0]
                            	: null;
						defaultParamValue =
                            eachMetrics.Default[`${defaultParam}`];
					}

					if (eachMetrics.Control && eachMetrics.Control.Value) {
						valueTableID = Number(Number(valueTableID) + 1);
						insertValueTable(
							valueTableID,
							eachMetrics.Control.Value
						);
						controlValueID = valueTableID;
						controlParam =
                            Object.keys(eachMetrics.Control)?.length > 0
                            	? Object.keys(eachMetrics.Control)[0]
                            	: null;
						controlParamValue =
                            eachMetrics.Control[`${controlParam}`];
					}

					if (
						eachMetrics.Experiment &&
                        eachMetrics.Experiment.Value
					) {
						valueTableID = Number(Number(valueTableID) + 1);
						insertValueTable(
							valueTableID,
							eachMetrics.Experiment.Value
						);
						experimentValueID = valueTableID;
						experimentParam =
                            Object.keys(eachMetrics.Experiment)?.length > 0
                            	? Object.keys(eachMetrics.Experiment)[0]
                            	: null;
						experimentParamValue =
                            eachMetrics.Experiment[`${experimentParam}`];
					}

					const querySetMetricsdata: Querysetmetrics = {
						querysetid: querysetId,
						querysetmetricsname: !('Name' in eachMetrics)
							? null
							: eachMetrics.Name.trim(),
						querysetmetricsdefaultparam: defaultParam,
						querysetmetricsdefaultparamvalue: defaultParamValue,
						querysetmetricsdefaultvalue: defaultValueID,
						querysetmetricscontrolparam: controlParam,
						querysetmetricscontrolparamvalue: controlParamValue,
						querysetmetricscontrolvalue: controlValueID,
						querysetmetricsexperimentparam: experimentParam,
						querysetmetricsexperimentparamvalue:
                            experimentParamValue,
						querysetmetricsexperimentvalue: experimentValueID,
					};

					querysetMetricsArr.push(querySetMetricsdata);
					const prepareInsertQuerySetMetricsData =
                        new PreparedStatement({
                        	name: `import-${preparedStatementUniqueName}-querySetMetricsData`,
                        	text: 'INSERT INTO querysetmetrics ( querysetid, \
              querysetmetricsname, \
              querysetmetricsdefaultparam, \
              querysetmetricsdefaultparamvalue, \
              querysetmetricsdefaultvalue, \
              querysetmetricscontrolparam, \
              querysetmetricscontrolparamvalue, \
              querysetmetricscontrolvalue, \
              querysetmetricsexperimentparam, \
              querysetmetricsexperimentparamvalue, \
              querysetmetricsexperimentvalue \
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
                        	values: [
                        		querySetMetricsdata.querysetid,
                        		querySetMetricsdata.querysetmetricsname,
                        		querySetMetricsdata.querysetmetricsdefaultparam,
                        		querySetMetricsdata.querysetmetricsdefaultparamvalue,
                        		querySetMetricsdata.querysetmetricsdefaultvalue,
                        		querySetMetricsdata.querysetmetricscontrolparam,
                        		querySetMetricsdata.querysetmetricscontrolparamvalue,
                        		querySetMetricsdata.querysetmetricscontrolvalue,
                        		querySetMetricsdata.querysetmetricsexperimentparam,
                        		querySetMetricsdata.querysetmetricsexperimentparamvalue,
                        		querySetMetricsdata.querysetmetricsexperimentvalue,
                        	],
                        });
					await db.none(prepareInsertQuerySetMetricsData);
					preparedStatementUniqueName += 1;
				} catch (err) {
					console.log('err querysetmetrics', err);
					flag = false;
					errorMessageToReturn +=
                        '<br /> error inserting querysetmetrics : ' +
                        err.message
                        	? err.message
                        	: err;
				}
			}
		);
		if (isAvgNdcg == false) {
			await dummyQuerySetMetrics();
		}
		await Promise.all([waitForProcessToComplete]);
		//console.timeEnd("querysetmetrics=>");
	}

	function insertQueryMetrics(eachQuery: any, queryNumber: number) {
		let isNdcg = false;
		//console.time("QueryMetrics=>");
		eachQuery.QueryMetrics.map((eachMetrics: jsonDataInterface) => {
			try {
				if (eachMetrics.Name === 'ndcg') {
					isNdcg = true;
				}
				let defaultValueID = null,
					controlValueID = null,
					experimentValueID = null,
					defaultParam = null,
					defaultParamValue = null,
					controlParam = null,
					controlParamValue = null,
					experimentParam = null,
					experimentParamValue = null;

				if (eachMetrics.Default && eachMetrics.Default.Value) {
					valueTableID = Number(Number(valueTableID) + 1);
					insertValueTable(valueTableID, eachMetrics.Default.Value);
					defaultValueID = valueTableID;
					defaultParam =
                        Object.keys(eachMetrics.Default)?.length > 0
                        	? Object.keys(eachMetrics.Default)[0]
                        	: null;
					defaultParamValue = eachMetrics.Default[`${defaultParam}`];
				}

				if (eachMetrics.Control && eachMetrics.Control.Value) {
					valueTableID = Number(Number(valueTableID) + 1);
					insertValueTable(valueTableID, eachMetrics.Control.Value);
					controlValueID = valueTableID;
					controlParam =
                        Object.keys(eachMetrics.Control)?.length > 0
                        	? Object.keys(eachMetrics.Control)[0]
                        	: null;
					controlParamValue = eachMetrics.Control[`${controlParam}`];
				}

				if (eachMetrics.Experiment && eachMetrics.Experiment.Value) {
					valueTableID = Number(Number(valueTableID) + 1);
					insertValueTable(
						valueTableID,
						eachMetrics.Experiment.Value
					);
					experimentValueID = valueTableID;
					experimentParam =
                        Object.keys(eachMetrics.Experiment)?.length > 0
                        	? Object.keys(eachMetrics.Experiment)[0]
                        	: null;
					experimentParamValue =
                        eachMetrics.Experiment[`${experimentParam}`];
				}

				const queryMetricsData: Querymetrics = {
					queriesid: queriesID,
					querymetricsname: !('Name' in eachMetrics)
						? null
						: eachMetrics.Name,
					querymetricsdefaultparam: defaultParam,
					querymetricsdefaultparamvalue: defaultParamValue,
					querymetricsdefaultvalue: defaultValueID,
					querymetricscontrolparam: controlParam,
					querymetricscontrolparamvalue: controlParamValue,
					querymetricscontrolvalue: controlValueID,
					querymetricsexperimentparam: experimentParam,
					querymetricsexperimentparamvalue: experimentParamValue,
					querymetricsexperimentvalue: experimentValueID,
				};
				queryMetricsDataToInsert.push(queryMetricsData);
			} catch (err) {
				flag = false;
				console.log('err queryMetricsdata', err);
				errorMessageToReturn +=
                    '<br /> error parsing queryMetricsdata from query ' +
                    queryNumber +
                    ' +/- 10 : ' +
                    err;
			}
		});
		if (isNdcg === false) {
			insertDummyNDCGQueryMetrics();
		}
		//console.timeEnd("QueryMetrics=>");
	}

	function insertQueryRatings(eachQuery: any, queryNumber: number) {
		let isCompareAB = false;
		//console.time("QueryRatings=>");
		eachQuery.QueryRatings.map((eachRatings: jsonDataInterface) => {
			try {
				if (eachRatings.Name === 'compare_A_B') {
					isCompareAB = true;
				}
				const queryRatingUnique =
                    moment().valueOf() +
                    Math.floor(1000 + Math.random() * 9000).toString();
				let aggregatedValueID = null;
				if (
					'AggregatedValue' in eachRatings &&
                    eachRatings.AggregatedValue
				) {
					valueTableID = Number(Number(valueTableID) + 1);
					insertValueTable(valueTableID, eachRatings.AggregatedValue);
					aggregatedValueID = valueTableID;
				}

				let overrideValueID = null;
				if (eachRatings.Override) {
					valueTableID = Number(Number(valueTableID) + 1);
					insertValueTable(valueTableID, eachRatings.Override);
					overrideValueID = valueTableID;
				} else {
					valueTableID = Number(Number(valueTableID) + 1);
					if (eachRatings.AggregatedValue) {
						insertValueTable(
							valueTableID,
							eachRatings.AggregatedValue
						);
					} else {
						insertValueTable(valueTableID, null);
					}
					overrideValueID = valueTableID;
				}

				const ratingName: any = !('Name' in eachRatings)
					? null
					: eachRatings.Name;
				const ratingScale: number =
                    queryRatingScale && ratingName in queryRatingScale
                    	? queryRatingScale[ratingName]
                    	: 5;
				let ratingType = 'Float';
				if (
					'AggregatedValue' in eachRatings &&
                    eachRatings.AggregatedValue
				) {
					if (eachRatings.AggregatedValue.String) {
						ratingType = 'String';
					} else if (eachRatings.AggregatedValue.Bool) {
						ratingType = 'Bool';
					}
				}

				queryRatingID = Number(Number(queryRatingID) + 1);
				const queryRatingsData: Queryratings = {
					queryratingsid: queryRatingID,
					queriesid: queriesID,
					aggregatedvalue: aggregatedValueID,
					overridevalue: overrideValueID,
					queryratingname: ratingName,
					ratingscale: ratingScale,
					ratingtype: ratingType,
					uniquekey: queryRatingUnique,
				};

				queryRatingsDataToInsert.push(queryRatingsData);

				if (queryRatingsData.queryratingname === 'compare_A_B') {
					sidebysideratingsID = Number(
						Number(sidebysideratingsID) + 1
					);
					const querySideBySideRating: Sidebysideratings = {
						sidebysideratingsid: sidebysideratingsID,
						queriesid: queriesID,
						ratingtext: eachRatings.AggregatedValue.String,
					};
					sidebysideRatingsDataToInsert.push(querySideBySideRating);
				}

				//===================attempts==============//
				if (
					'Attempts' in eachRatings &&
                    eachRatings.Attempts?.length > 0
				) {
					//console.time("attempts=> queryratingsid=>" + queryRatingID);
					eachRatings.Attempts.map((eachAttempt: any) => {
						try {
							insertAttempts(eachAttempt, 'queryratings');
						} catch (err) {
							flag = false;
							console.log('err query attemptsdata', err);
							errorMessageToReturn +=
                                '<br /> error parsing query attemptsdata from query ' +
                                queryNumber +
                                ' +/- 10 : ' +
                                err;
						}
					});
					// console.timeEnd("attempts=> queryratingsid=>" + queryRatingID);
				}
				//===================ENDS attempts==========//
			} catch (err) {
				flag = false;
				console.log('err queryratingsdata', err);
				errorMessageToReturn +=
                    '<br /> error parsing queryratingsdata from query ' +
                    queryNumber +
                    ' +/- 10 : ' +
                    err;
			}
		});
		if (isCompareAB == false) {
			dummyQueryRatings();
		}
		//console.timeEnd("QueryRatings=>");
	}

	function insertQueryResults(eachQuery: any, queryNumber: number) {
		eachQuery.QueryResults.map((eachResults: any) => {
			try {
				insertQueryResultsData(eachResults);
				if (
					'ResultRatings' in eachResults &&
                    eachResults.ResultRatings?.length > 0
				) {
					let isResultRating = false;
					eachResults.ResultRatings.map((eachResultRate: any) => {
						try {
							if (eachResultRate.Name == 'rating') {
								isResultRating = true;
							}
							insertResultRatingsData(eachResultRate);
							//===================attempts==============//
							if (
								'Attempts' in eachResultRate &&
                                eachResultRate.Attempts?.length > 0
							) {
								eachResultRate.Attempts.map(
									(eachAttempt: jsonDataInterface) => {
										try {
											insertAttempts(
												eachAttempt,
												'resultratings'
											);
										} catch (err) {
											console.log(
												'err result attemptsdata',
												err
											);
											flag = false;
											errorMessageToReturn +=
                                                '<br /> error parsing result attemptsdata from query ' +
                                                queryNumber +
                                                ' +/- 10 : ' +
                                                err;
										}
									}
								);
							}
						} catch (err) {
							flag = false;
							console.log('err resultratingsdata', err);
							errorMessageToReturn +=
                                '<br /> error parsing resultratingsdata from query ' +
                                queryNumber +
                                ' +/- 10 : ' +
                                err;
						}
					});
					if (isResultRating == false) {
						dummyResultRating();
					}
				} else {
					dummyResultRating();
				}
				//================================resultratings ENDS=====================//

				// ======================resultsidemetadata=======================//
				if (
					'SideMetadata' in eachResults &&
                    eachResults.SideMetadata &&
                    Object.keys(eachResults.SideMetadata)?.length > 0
				) {
					insertResultsidemetadata(eachResults, queryNumber);
				}
				//=====================resultsidemetadata  ENDS=================//
			} catch (err) {
				flag = false;
				console.log('err queryresultsdata', err);
				errorMessageToReturn +=
                    '<br />error parsing queryresultsdata from query ' +
                    queryNumber +
                    ' +/- 10 : ' +
                    err.message
                    	? err.message
                    	: err;
			}
		});
	}

	function insertDummyNDCGQueryMetrics() {
		let defaultValueID = null,
			controlValueID = null,
			experimentValueID = null;

		//for Default
		valueTableID = Number(Number(valueTableID) + 1);
		insertValueTable(valueTableID, null);
		defaultValueID = valueTableID;

		//for Control
		valueTableID = Number(Number(valueTableID) + 1);
		insertValueTable(valueTableID, null);
		controlValueID = valueTableID;

		//for Experiment
		valueTableID = Number(Number(valueTableID) + 1);
		insertValueTable(valueTableID, null);
		experimentValueID = valueTableID;

		const queryMetricsData: Querymetrics = {
			queriesid: queriesID,
			querymetricsname: 'ndcg',
			querymetricsdefaultparam: null,
			querymetricsdefaultparamvalue: null,
			querymetricsdefaultvalue: defaultValueID,
			querymetricscontrolparam: null,
			querymetricscontrolparamvalue: null,
			querymetricscontrolvalue: controlValueID,
			querymetricsexperimentparam: null,
			querymetricsexperimentparamvalue: null,
			querymetricsexperimentvalue: experimentValueID,
		};
		queryMetricsDataToInsert.push(queryMetricsData);
	}

	function insertAttempts(eachAttempt: any, insertRatingType: string) {
		ratingAttemptsID = Number(Number(ratingAttemptsID) + 1);
		const attemptsData: Ratingsattempts = {
			ratingsattemptsid: ratingAttemptsID,
			ratingsid: queryRatingID,
			ratingstype: insertRatingType,
			rater: !('Rater' in eachAttempt) ? null : eachAttempt.Rater,
			ratingvaluebool:
                'Value' in eachAttempt &&
                eachAttempt.Value &&
                eachAttempt.Value.Bool
                	? eachAttempt.Value.Bool
                	: null,
			ratingvaluefloat:
                'Value' in eachAttempt &&
                eachAttempt.Value &&
                eachAttempt.Value.Float
                	? eachAttempt.Value.Float
                	: null,
			ratingvaluestring:
                'Value' in eachAttempt &&
                eachAttempt.Value &&
                eachAttempt.Value.String
                	? eachAttempt.Value.String
                	: null,
		};
		allAttemptsDataToInsert.push(attemptsData);
	}

	function insertResultsidemetadata(eachResults: any, queryNumber: number) {
		Object.keys(eachResults.SideMetadata).map((metadata: string) => {
			try {
				if (eachResults.SideMetadata[metadata]) {
					const resultSideMetaData: Resultsidemetadata = {
						queryresultsid: queryResultID,
						sidemetadatatype: metadata,
						sidemetadatadocsignals:
                            'DocSignals' in eachResults.SideMetadata[metadata]
                            	? eachResults.SideMetadata[metadata].DocSignals
                            	: null,
						sidemetadatarank:
                            'Rank' in eachResults.SideMetadata[metadata]
                            	? eachResults.SideMetadata[metadata].Rank
                            	: null,
						sidemetadatatitle:
                            'Title' in eachResults.SideMetadata[metadata]
                            	? eachResults.SideMetadata[metadata].Title
                            	: null,
						sidemetadatasnippet:
                            'Snippet' in eachResults.SideMetadata[metadata]
                            	? eachResults.SideMetadata[metadata].Snippet
                            	: null,
						excludefrommainmetrics:
                            'ExcludeFromMainMetrics' in
                            eachResults.SideMetadata[metadata]
                            	? eachResults.SideMetadata[metadata]
                            		.ExcludeFromMainMetrics
                            	: false,
						koalascore:
                            'KoalaScore' in eachResults.SideMetadata[metadata]
                            	? eachResults.SideMetadata[metadata].KoalaScore
                            	: null,
						koalashard:
                            'KoalaShard' in eachResults.SideMetadata[metadata]
                            	? eachResults.SideMetadata[metadata].KoalaShard
                            	: null,
					};

					resultSideMetaDataToInsert.push(resultSideMetaData);
				}
			} catch (err) {
				console.log('err resultsidemetadata', err);
				flag = false;
				errorMessageToReturn +=
                    '<br /> error parsing resultsidemetadata from query ' +
                    queryNumber +
                    ' +/- 10 : ' +
                    err;
			}
		});
	}

	function insertResultRatingsData(eachResultRate: any) {
		const resultRatingsUnique =
            moment().valueOf() +
            Math.floor(1000 + Math.random() * 9000).toString();
		let aggregatedValueID = null;
		if (
			'AggregatedValue' in eachResultRate &&
            eachResultRate.AggregatedValue
		) {
			valueTableID = Number(Number(valueTableID) + 1);
			insertValueTable(valueTableID, eachResultRate.AggregatedValue);
			aggregatedValueID = valueTableID;
		}

		let overrideValueID = null;
		if ('Override' in eachResultRate && eachResultRate.Override) {
			valueTableID = Number(Number(valueTableID) + 1);
			insertValueTable(valueTableID, eachResultRate.Override);
			overrideValueID = valueTableID;
		} else {
			valueTableID = Number(Number(valueTableID) + 1);
			if (
				'AggregatedValue' in eachResultRate &&
                eachResultRate.AggregatedValue
			) {
				insertValueTable(valueTableID, eachResultRate.AggregatedValue);
			} else {
				insertValueTable(valueTableID, null);
			}
			overrideValueID = valueTableID;
		}

		const ratingName: string = !('Name' in eachResultRate)
			? null
			: eachResultRate.Name;
		const ratingScale: number =
            resultRatingScale && ratingName in resultRatingScale
            	? resultRatingScale[ratingName]
            	: 5;
		let ratingType = 'Float';
		if (
			'AggregatedValue' in eachResultRate &&
            eachResultRate.AggregatedValue
		) {
			if (eachResultRate.AggregatedValue.String) {
				ratingType = 'String';
			} else if (eachResultRate.AggregatedValue.Bool) {
				ratingType = 'Bool';
			}
		}

		resultRatingID = Number(Number(resultRatingID) + 1);
		const resultRatingsData: Resultratings = {
			resultratingsid: resultRatingID,
			queryresultsid: queryResultID,
			aggregatedvalue: aggregatedValueID,
			overridevalue: overrideValueID,
			resultratingname: ratingName,
			ratingscale: ratingScale,
			ratingtype: ratingType,
			uniquekey: resultRatingsUnique,
		};

		resultRatingDataToInsert.push(resultRatingsData);
	}

	function insertQueryResultsData(eachResults: any) {
		queryResultID = Number(Number(queryResultID) + 1);
		const queryResultsUnique =
            moment().valueOf() +
            Math.floor(1000 + Math.random() * 9000).toString();
		const queryResultsData: Queryresults = {
			queryresultsid: queryResultID,
			queriesid: queriesID,
			actionurl: !('ActionURL' in eachResults)
				? null
				: eachResults.ActionURL,
			resultid: !('ID' in eachResults) ? null : eachResults.ID,
			scalerank: !('ScaleRank' in eachResults)
				? null
				: eachResults.ScaleRank,
			segments: !('Segments' in eachResults)
				? null
				: eachResults.Segments,
			snippet: !('Snippet' in eachResults) ? null : eachResults.Snippet,
			title: !('Title' in eachResults) ? null : eachResults.Title,
			typename: !('TypeName' in eachResults)
				? null
				: eachResults.TypeName,
			universaltype: !('UniversalType' in eachResults)
				? null
				: eachResults.UniversalType,
			uniquekey: queryResultsUnique,
		};

		queryResultsDataToInsert.push(queryResultsData);
	}

	async function insertAllSQLExecutionData(
		parallelInsertion: Array<parallelInsertionInterface>
	) {
		if (valueTableDataToInsert.length > 0) {
			const prepareValueTableData = new PreparedStatement({
				name: `import-${preparedStatementUniqueName}-valueTableData`,
				text: pgp.helpers.insert(valueTableDataToInsert, csValuetable),
			});
			const valueTableData = db.none(prepareValueTableData);
			parallelInsertion.push(valueTableData);
		}

		if (queriesDataToInsert.length > 0) {
			const prepareQueiresData = new PreparedStatement({
				name: `import-${preparedStatementUniqueName}-queriesData`,
				text: pgp.helpers.insert(queriesDataToInsert, csQueries),
			});
			const queriesData = db.none(prepareQueiresData);
			parallelInsertion.push(queriesData);
		}

		if (queryMetricsDataToInsert.length > 0) {
			const prepareQueryMetricsData = new PreparedStatement({
				name: `import-${preparedStatementUniqueName}-qyertMetricsDataData`,
				text: pgp.helpers.insert(
					queryMetricsDataToInsert,
					csQuerymetrics
				),
			});
			const queryMetricsData = db.none(prepareQueryMetricsData);
			parallelInsertion.push(queryMetricsData);
		}

		if (allAttemptsDataToInsert.length > 0) {
			const prepareAllAttemptsData = new PreparedStatement({
				name: `import-${preparedStatementUniqueName}-allAttemptsData`,
				text: pgp.helpers.insert(allAttemptsDataToInsert, csAttempts),
			});
			const allAttemptsData = db.none(prepareAllAttemptsData);
			parallelInsertion.push(allAttemptsData);
		}

		if (queryRatingsDataToInsert.length > 0) {
			const prepareQueryRatingsData = new PreparedStatement({
				name: `import-${preparedStatementUniqueName}-queryRatingsData`,
				text: pgp.helpers.insert(
					queryRatingsDataToInsert,
					csQueryratings
				),
			});
			const queryRatingsData = db.none(prepareQueryRatingsData);
			parallelInsertion.push(queryRatingsData);
		}

		if (sidebysideRatingsDataToInsert.length > 0) {
			const prepareSidebySideRatingsData = new PreparedStatement({
				name: `import-${preparedStatementUniqueName}-sidebysideRatingsData`,
				text: pgp.helpers.insert(
					sidebysideRatingsDataToInsert,
					csSidebysideratings
				),
			});
			const sidebysideRatingsData = db.none(prepareSidebySideRatingsData);
			parallelInsertion.push(sidebysideRatingsData);
		}

		if (queryResultsDataToInsert.length > 0) {
			const prepareQueryResultsData = new PreparedStatement({
				name: `import-${preparedStatementUniqueName}-queryResultsData`,
				text: pgp.helpers.insert(
					queryResultsDataToInsert,
					csQueryresults
				),
			});
			const queryResultsData = db.none(prepareQueryResultsData);
			parallelInsertion.push(queryResultsData);
		}

		if (resultRatingDataToInsert.length > 0) {
			const prepareResultRatingData = new PreparedStatement({
				name: `import-${preparedStatementUniqueName}-resultRatingData`,
				text: pgp.helpers.insert(
					resultRatingDataToInsert,
					csResultratings
				),
			});
			const resultRatingData = db.none(prepareResultRatingData);
			parallelInsertion.push(resultRatingData);
		}

		if (resultSideMetaDataToInsert.length > 0) {
			const prepareResultSideMetaData = new PreparedStatement({
				name: `import-${preparedStatementUniqueName}-resultSideMetaData`,
				text: pgp.helpers.insert(
					resultSideMetaDataToInsert,
					csResultsidemetadata
				),
			});
			const resultSideMetaData = db.none(prepareResultSideMetaData);
			parallelInsertion.push(resultSideMetaData);
		}

		if (queryTagsDataToInsert.length > 0) {
			const prepareQueryTagsData = new PreparedStatement({
				name: `import-${preparedStatementUniqueName}-queryTagsData`,
				text: pgp.helpers.insert(queryTagsDataToInsert, csQuerytags),
			});
			const queryTagsData = db.none(prepareQueryTagsData);
			parallelInsertion.push(queryTagsData);
		}
		preparedStatementUniqueName += 1;
	}
};

const insertValueTable = async (
	valid: number,
	value: valuesInterface | null
) => {
	const unique: string =
        moment().valueOf() + Math.floor(1000 + Math.random() * 9000).toString();
	const valBool: boolean | null =
        value !== null && value.Bool ? value.Bool : null;
	const valFloat: number | null | undefined =
        value !== null &&
        typeof value.Float !== undefined &&
        value.Float !== null
        	? value.Float
        	: null;
	const valString: string | null =
        value !== null && value.String ? value.String : null;

	const valueTableData: Valuetable = {
		valuetableid: valid,
		valuebool: valBool,
		valuefloat: valFloat,
		valuestring: valString,
		uniquekey: unique,
	};
	valueTableDataToInsert.push(valueTableData);
	return valid;
};

async function logImportedData(querysetId: number, userId: number, db: any) {
	console.log('querysetid ->', querysetId);
	console.log('userid ->', userId);

	const prepareUploadQuerySetDetails = new PreparedStatement({
		name: `import-${preparedStatementUniqueName}-selectQuerySetDetails`,
		text: 'SELECT querysetid, querysettype, importedon, metricdefinitions_primarymetric, savedfilename, originalfilename, importedby, querysetdescription, imports3path FROM querysetdetails WHERE querysetid = $1',
		values: [querysetId],
	});
	const uploadedQuerySetDetails = await db.one(prepareUploadQuerySetDetails);
	preparedStatementUniqueName += 1;
	console.log('uploadedQuerySetDetails ->', uploadedQuerySetDetails);
	console.log(
		'\n user id of QuerySetDetails ->',
		uploadedQuerySetDetails.importedby
	);

	const prepareQueriesDetails = new PreparedStatement({
		name: `import-${preparedStatementUniqueName}-selectQueriesDetails`,
		text: 'SELECT queriesid, querysetid, querystring, isexclude, totalresults FROM queries WHERE querysetid=$1 LIMIT 1',
		values: [querysetId],
	});
	const queriesDetails = await db.one(prepareQueriesDetails);
	preparedStatementUniqueName += 1;
	console.log('queriesDetails ->', queriesDetails);

	const prepareUserDetails = new PreparedStatement({
		name: `import-${preparedStatementUniqueName}-selectUserDetails`,
		text: 'SELECT first_name, last_name, user_role FROM users WHERE id=$1',
		values: [uploadedQuerySetDetails.importedby],
	});
	const userDetails = await db.one(prepareUserDetails);
	preparedStatementUniqueName += 1;
	console.log('userDetails ->', userDetails);

	const prepareQuerySetMetricsDetails = new PreparedStatement({
		name: `import-${preparedStatementUniqueName}-QuerySetMetricsDetails`,
		text: 'SELECT querysetmetricsid, querysetmetricsname, \
    querysetmetricsdefaultparam, querysetmetricsdefaultparamvalue, querysetmetricsdefaultvalue, \
    querysetmetricscontrolparam, querysetmetricscontrolparamvalue, querysetmetricscontrolvalue \
    FROM querysetmetrics WHERE querysetid=$1 AND querysetmetricsname=$2 LIMIT 1',
		values: [
			querysetId,
			uploadedQuerySetDetails.metricdefinitions_primarymetric,
		],
	});
	const querySetMetricsDetails = await db.any(prepareQuerySetMetricsDetails);
	preparedStatementUniqueName += 1;
	console.log('querySetMetricsDetails ->', querySetMetricsDetails);

	const prepareValueTableDetails = new PreparedStatement({
		name: `import-${preparedStatementUniqueName}-selectValueTableDetails`,
		text: 'SELECT valuetableid,valuefloat,uniquekey FROM valuetable WHERE valuetableid IN (SELECT querysetmetricsdefaultvalue FROM querysetmetrics WHERE querysetid=$1 AND querysetmetricsname=$2 ) LIMIT 1',
		values: [
			querysetId,
			uploadedQuerySetDetails.metricdefinitions_primarymetric,
		],
	});
	const valueTableDetails = await db.any(prepareValueTableDetails);
	preparedStatementUniqueName += 1;
	console.log('valueTableDetails ->', valueTableDetails);

	const prepareCombinedQuery = new PreparedStatement({
		name: `import-${preparedStatementUniqueName}-selectCombinedQuery`,
		text: 'SELECT DISTINCT querysetdetails.querysetid,querysetdetails.querysetdescription,querysetdetails.batch,querysetdetails.importedon,querysetdetails.originalfilename,querysetdetails.metricdefinitions_primarymetric, \
      querysetdetails.batchcompletedat,querysetdetails.batchcreatedat, \
      querycount.totalqueries, \
      querysetmetrics.querysetmetricsdefaultvalue, \
      defMetricVal.valueFloat as metricValueFloat, defMetricVal.valuebool as metricValueBool, defMetricVal.valuestring as metricValueString, \
      users.first_name as importedbyfirstname, users.last_name as importedbylastname \
      FROM querysetdetails \
      JOIN queries ON queries.querysetid = querysetdetails.querysetid \
      JOIN users ON querysetdetails.importedby = users.id \
      LEFT JOIN querysetmetrics on (queries.querysetid =  querysetmetrics.querysetid \
      AND querysetdetails.metricdefinitions_primarymetric = querysetmetrics.querysetmetricsname) \
      LEFT JOIN valuetable as defMetricVal on defMetricVal.valuetableid = querysetmetrics.querysetmetricsdefaultvalue \
      JOIN ( \
      SELECT queries.querysetid, COUNT(*) totalqueries FROM queries \
      GROUP BY queries.querysetid ORDER BY queries.querysetid \
      ) querycount ON querycount.querysetid = queries.querysetid \
      WHERE querysetdetails.querysetid=$1 AND querysetdetails.querysettype=$2 AND querysetdetails.is_active=true \
      ORDER BY querysetdetails.importedon DESC LIMIT 1',
		values: [querysetId, uploadedQuerySetDetails.querysettype],
	});
	const combinedQuery = await db.any(prepareCombinedQuery);
	preparedStatementUniqueName += 1;
	console.log('CombinedQuery ->', combinedQuery);
}
