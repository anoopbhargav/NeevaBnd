import { float, integer } from 'aws-sdk/clients/lightsail';
import { PreparedStatement } from 'pg-promise';
import { getConnection } from '../db';
const moment = require('moment');
import { Querysetmetrics, Valuetable } from '../models/DBModels/index';
import {
	updateRatingInterface,
	excludeQueryInterface,
	singleSideResultsWithRatingsInterface,
	updateSideBySideRatingInterface,
	deleteQuerysetInterface,
	updateQuerysetMetricInterface,
} from '../models/interface/updateInterface';
import { commonReqResInterface } from '../models/interface/commonReqResInterface';

const path = require('path');

export const updateQueryExclude = async (
	updateQueryExcludeData: excludeQueryInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { isexclude, queriesid } = updateQueryExcludeData;
		const prepareQueryResults = new PreparedStatement({
			name: 'update-queries',
			text: 'UPDATE queries SET isexclude=$1 WHERE queriesid=$2',
			values: [isexclude, queriesid],
		});
		const queryResults = await db.none(prepareQueryResults);
		if (queryResults !== undefined)
			res.status(200).json({
				status: 200,
				message:
                    isexclude === true
                    	? 'query excluded successfully'
                    	: 'query included successfully',
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in updating query exclude',
			});
	} catch (err) {
		console.log('error in updateQueryExclude : ' + err);
		res.status(500).json({
			status: 500,
			message:
                'error in updateQueryExclude :' + err.message
                	? err.message
                	: err,
		});
	}
};

export const singleSideResultDetailsWithRatings = async (
	singleSideResultDetailsWithRatingsData: singleSideResultsWithRatingsInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { queryresultsid, queryside } =
            singleSideResultDetailsWithRatingsData;
		const prepareResults = new PreparedStatement({
			name: 'get-results',
			text: 'SELECT *\
         FROM queryresults \
         JOIN resultsidemetadata \
         ON resultsidemetadata.queryresultsid = queryresults.queryresultsid \
         WHERE queryresults.queryresultsid=$1 \
         AND resultsidemetadata.sidemetadatatype=$2 \
         ORDER BY queryresults.queryresultsid',
			values: [queryresultsid, queryside ? queryside : 'Control'],
		});
		const results = await db.many(prepareResults);

		const prepareRatingDetails = new PreparedStatement({
			name: 'get-ratingDetails',
			text: 'SELECT *\
         FROM resultratings \
         JOIN valuetable \
         ON resultratings.overridevalue = valuetable.valuetableid \
         JOIN resultsidemetadata \
         ON resultsidemetadata.queryresultsid = resultratings.queryresultsid \
         WHERE resultratings.queryresultsid=$1 \
         AND resultsidemetadata.sidemetadatatype=$2 \
         ORDER BY resultratingsid',
			values: [queryresultsid, queryside ? queryside : 'Control'],
		});
		const ratingDetails = await db.many(prepareRatingDetails);

		if (results)
			res.status(200).json({
				status: 200,
				resultdetails: results,
				ratingdetails: ratingDetails,
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in fetching single side results',
			});
	} catch (err) {
		console.log('error in singleSideResultDetailsWithRatings : ' + err);
		res.status(500).json({
			status: 500,
			message:
                'error in singleSideResultDetailsWithRatings :' + err.message
                	? err.message
                	: err,
		});
	}
};

export const updateRatings = async (
	updateRatingData: updateRatingInterface,
	res: commonReqResInterface
) => {
	console.time('total time to updateRatings');
	const db = await getConnection();
	try {
		const { overridevalue, value, ratingName, ratingtype } =
            updateRatingData;
		let updateResults;
		if (ratingtype === 'Bool') {
			console.time('update with recent value if Bool=>');
			const prepareUpdateResults = new PreparedStatement({
				name: 'update-valuetable-in-if',
				text: 'UPDATE valuetable SET valuebool=$1,invaliddata=true WHERE valuetableid=$2',
				values: [value, overridevalue],
			});
			updateResults = await db.none(prepareUpdateResults);
			console.timeEnd('update with recent value if Bool=>');
		} else {
			console.time('update with recent value =>');
			const prepareUpdateResults = new PreparedStatement({
				name: 'update-valuetable-in-else',
				text: 'UPDATE valuetable SET valuefloat=$1,invaliddata=true WHERE valuetableid=$2',
				values: [value, overridevalue],
			});
			updateResults = await db.none(prepareUpdateResults);
			console.timeEnd('update with recent value =>');
		}

		//get query id and query set id
		console.time('selecting queryResultID =>');
		const prepareQueryResultID = new PreparedStatement({
			name: 'get-queryResultID',
			text: 'SELECT queries.querysetid as querysetid, queryresults.queriesid as queriesid, \
      resultratings.queryresultsid \
      FROM resultratings \
      JOIN queryresults ON queryresults.queryresultsid = resultratings.queryresultsid \
      JOIN queries ON queries.queriesid = queryresults.queriesid \
      WHERE resultratings.overridevalue = $1',
			values: [overridevalue],
		});
		const queryResultID = await db.many(prepareQueryResultID);
		console.timeEnd('selecting queryResultID =>');
		if (queryResultID.length > 0) {
			await updateRatingQueryResultID(db, ratingName, queryResultID);
		}

		if (updateResults !== undefined)
			res.status(200).json({
				status: 200,
				message: 'Rating updated successfully',
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in updating rating',
			});
	} catch (err) {
		console.log('error in updateRatings : ' + err);
		res.status(500).json({
			status: 500,
			message:
                'error in updateRatings :' + err.message ? err.message : err,
		});
	}
	console.timeEnd('total time to updateRatings');
};

export const updateSideBySideRatings = async (
	updateSideBySideRatingsData: updateSideBySideRatingInterface,
	res: commonReqResInterface
) => {
	console.time('total time for updateSideBySideRatings =>');
	const db = await getConnection();
	try {
		const { sidebysideratingsid, queriesid, rating } =
            updateSideBySideRatingsData;
		const updateResults = await callUpdateValueTablePromises(
			db,
			queriesid,
			rating,
			res,
			sidebysideratingsid
		);
		//update query set count
		//get query set id
		const [results, resultIDSVariable, querySetID] =
            await callResultAndResultIDS(db, queriesid);
		let resultIDS = resultIDSVariable;

		if (resultIDS.length == 0 || resultIDS.length != 5) {
			if (resultIDS.length == 0) {
				//need to insert to querysetmetrics
				console.time('insert insertCompareAB_Metrics time =>');
				await insertCompareAB_Metrics(db, querySetID, rating);
				console.timeEnd('insert insertCompareAB_Metrics time =>');
			} else {
				//all metrics are not present, check if current is already present, else insert
				let metricPresent = false;
				await resultIDS.map(
					(eachID: { querysetmetricsname: string }) => {
						if (eachID.querysetmetricsname === rating) {
							metricPresent = true;
						}
					}
				);
				if (!metricPresent) {
					console.time('insert insertCompareAB_Metrics time =>');
					await insertCompareAB_Metrics(db, querySetID, rating);
					console.timeEnd('insert insertCompareAB_Metrics time =>');
				}
			}
			//read again
			console.time('reading all the ids =>');
			const queryString =
                'SELECT querysetmetrics.querysetmetricsname,querysetmetrics.querysetmetricsdefaultvalue \
      FROM  querysetmetrics WHERE (querysetmetricsname = \'much_better\' OR querysetmetricsname = \'better\' \
      OR querysetmetricsname = \'equal\' OR querysetmetricsname = \'worse\' \
      OR querysetmetricsname = \'much_worse\') AND querysetid = $1 \
      ORDER BY querysetmetrics.querysetmetricsname';
			const prepareResultIDSRead = new PreparedStatement({
				name: 'read-results',
				text: queryString,
				values: [querySetID],
			});
			resultIDS = await db.any(prepareResultIDSRead);
			console.timeEnd('reading all the ids =>');
		}
		await callRatingsToCheck(db, results, resultIDS);

		if (updateResults === true)
			res.status(200).json({
				status: 200,
				message: 'Rating updated successfully',
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in updating rating',
			});
	} catch (err) {
		console.log('error in updateSideBySideRatings : ' + err);
		res.status(500).json({
			status: 500,
			message:
                'error in updateSideBySideRatings :' + err.message
                	? err.message
                	: err,
		});
	}
	console.timeEnd('total time for updateSideBySideRatings =>');
};

const insertCompareAB_Metrics = async (
	db: any,
	querySetID: number,
	rating: string
) => {
	const prepareResValueTable = new PreparedStatement({
		name: 'insertCompareAB_Metrics-prepareResValueTable',
		text: 'SELECT MAX(valuetableid) FROM valuetable',
	});
	const resValueTableID = await db.one(prepareResValueTable);
	let valueTableID: number = resValueTableID.max;
	valueTableID = Number(Number(valueTableID) + 1);
	const unique: string =
        moment().valueOf() + Math.floor(1000 + Math.random() * 9000).toString();
	const valueTableData: Valuetable = {
		valuetableid: valueTableID,
		valuebool: null,
		valuefloat: 1,
		valuestring: null,
		uniquekey: unique,
	};
	const prepareInsertValuetable = new PreparedStatement({
		name: 'update-prepareInsertValuetable',
		text: 'INSERT INTO valuetable(valuetableid, \
      valuebool, \
      valuefloat, \
      valuestring, \
      uniquekey) VALUES($1, $2, $3, $4, $5)',
		values: [
			valueTableData.valuetableid,
			valueTableData.valuebool,
			valueTableData.valuefloat,
			valueTableData.valuestring,
			valueTableData.uniquekey,
		],
	});
	await db.none(prepareInsertValuetable);

	const querySetMetricsdata: Querysetmetrics = {
		querysetid: querySetID,
		querysetmetricsname: rating,
		querysetmetricsdefaultparam: null,
		querysetmetricsdefaultparamvalue: null,
		querysetmetricsdefaultvalue: valueTableID,
		querysetmetricscontrolparam: null,
		querysetmetricscontrolparamvalue: null,
		querysetmetricscontrolvalue: null,
		querysetmetricsexperimentparam: null,
		querysetmetricsexperimentparamvalue: null,
		querysetmetricsexperimentvalue: null,
	};
	const prepareQuerySetmtricsInsertion = new PreparedStatement({
		name: 'import-prepareQuerySetmtricsInsertion',
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
	await db.none(prepareQuerySetmtricsInsertion);
};

export const deletequeryset = async (
	deleteQuerysetData: deleteQuerysetInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { querysetid } = deleteQuerysetData;
		const prepareQueryset = new PreparedStatement({
			name: 'update-querysetdetails',
			text: 'UPDATE querysetdetails SET is_active=false WHERE querysetid=$1',
			values: [querysetid],
		});
		const queryset = await db.none(prepareQueryset);
		if (queryset !== undefined)
			res.status(200).json({
				status: 200,
				message: 'Queryset deleted successfully',
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in deleting queryset',
			});
	} catch (err) {
		console.log('error in deletequeryset : ' + err);
		res.status(500).json({
			status: 500,
			message:
                'error in deletequeryset :' + err.message ? err.message : err,
		});
	}
};

export const updateQuerysetMetric = async (
	updateQuerysetMetricData: updateQuerysetMetricInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	const { querysetid, querysetmetricname } = updateQuerysetMetricData;
	try {
		if (querysetmetricname !== 'avg_ndcg') {
			res.status(400).json({
				status: 400,
				message: 'Error in queryset metric name',
			});
			return;
		}

		const query =
            'UPDATE querysetmetrics \
        SET metricupdateprocessing = true \
        WHERE querysetid = $1 and querysetmetricsname = \'avg_ndcg\'';
		const prepareResults = new PreparedStatement({
			name: 'update-querymetrics-metricupdateprocessing',
			text: query,
			values: [querysetid],
		});
		await db.none(prepareResults);

		res.status(200).json({
			status: 200,
			message: 'Queryset metric will be recomputed',
		});

		const NDCGAllQueries = await updateNDCG(db, querysetid);

		if (!NDCGAllQueries.status) {
			await updateQuerySetMetrics(
				db,
				querysetid,
				NDCGAllQueries.control,
				NDCGAllQueries.experiment
			);
		} else {
			console.log(
				'Queryset metrics will not be updated as there is a failure in NDCG computation at query level'
			);
			setUpdateProcessingToFalse(db, querysetid);
		}
	} catch (err) {
		console.log('error in update queryset metric : ' + err);
		setUpdateProcessingToFalse(db, querysetid);
		res.status(500).json({
			status: 500,
			message:
                'error in update queryset metric :' + err.message
                	? err.message
                	: err,
		});
	}
};

async function updateNDCG(db: any, querysetID: number) {
	const queryControlNDCG: Array<number> = [];
	const queryExperimentNDCG: Array<number> = [];
	let totalQueiresPromise = [];
	let resultIDS, query;
	let anyQueryComputationFailed: boolean= false;
	let totalIteration = 0;
	const totalIterationToRun = 70;
	let resultIDSLength = 0;

	try {
		//find all queries in queryset with rating details inside each query and query rank from sidemetadata
		//rating = queryresults -ResultRatings-AggregatedValue-float
		//rank = queryresults - SideMetadata - Control - rank and experiment - rank
		query =
            'SELECT queries.queriesid, \
    listagg(queryresults.queryresultsid,\',\') \
    within group (ORDER BY queryresults.queryresultsid) as queryresultsidlist \
 FROM queries \
 JOIN queryresults ON queryresults.queriesid = queries.queriesid \
 WHERE queries.querysetid = $1 \
 GROUP BY queries.queriesid';
		const prepareResultIDS = new PreparedStatement({
			name: 'get-queriesid',
			text: query,
			values: [querysetID],
		});
		resultIDS = await db.many(prepareResultIDS);
		resultIDSLength = resultIDS.length;
	} catch (err) {
		setUpdateProcessingToFalse(db, querysetID);
		console.log(
			'error in update NDCG - get query ids : ' + err.message
				? err.message
				: err
		);
	}

	if (resultIDS && resultIDS.length > 0) {
		for (const eachQuery of resultIDS) {
			totalIteration += 1;
			query =
                'SELECT invaliddata from querymetrics \
      WHERE queriesid = $1 AND invaliddata = true';
			const preparereNeedToUpdateMetric = new PreparedStatement({
				name: 'select-invaliddata',
				text: query,
				values: [eachQuery.queriesid],
			});
			const needToUpdateMetric = db.any(preparereNeedToUpdateMetric);
			totalQueiresPromise.push(needToUpdateMetric);

			if (
				totalIteration % totalIterationToRun == 0 ||
                totalIteration === resultIDSLength
			) {
				let queryMetricsValuePromise: Array<string> = [];
				const settledTotalQueiresPromise = await Promise.all(
					totalQueiresPromise
				);
				anyQueryComputationFailed = await calledSettledTotalQueiresPromise(
					db,
					settledTotalQueiresPromise,
					eachQuery,
					querysetID,
					queryControlNDCG,
					queryExperimentNDCG,
					anyQueryComputationFailed,
					queryMetricsValuePromise
				);
				let settledQueryMetricsValuePromise: Array<{}> =
                    await Promise.all(queryMetricsValuePromise);
				settledQueryMetricsValuePromise =
                    await settledQueryMetricsValuePromise.map(
                    	async (
                    		valutableids: Array<{
                                length: number;
                                valutableids: Array<number>;
                                querymetricscontrolvalue: string;
                                querymetricsexperimentvalue: string;
                            }>
                    	) => {
                    		if (valutableids && valutableids.length > 0) {
                    			for (const eachValueTableids of valutableids) {
                    				let result;
                    				if (
                    					eachValueTableids.querymetricscontrolvalue
                    				) {
                    					query =
                                            'SELECT valuefloat from valuetable WHERE valuetableid = $1';
                    					const prepareControlValue =
                                            new PreparedStatement({
                                            	name: 'select-control-value',
                                            	text: query,
                                            	values: [
                                            		eachValueTableids.querymetricscontrolvalue,
                                            	],
                                            });
                    					result = await db.one(
                    						prepareControlValue
                    					);
                    					queryControlNDCG.push(
                    						result.valuefloat
                    					);
                    				}
                    				if (
                    					eachValueTableids.querymetricsexperimentvalue
                    				) {
                    					query =
                                            'SELECT valuefloat from valuetable WHERE valuetableid = $1';
                    					const prepareExperimentValue =
                                            new PreparedStatement({
                                            	name: 'select-experiment-value',
                                            	text: query,
                                            	values: [
                                            		eachValueTableids.querymetricsexperimentvalue,
                                            	],
                                            });
                    					result = await db.one(
                    						prepareExperimentValue
                    					);
                    					queryExperimentNDCG.push(
                    						result.valuefloat
                    					);
                    				}
                    			}
                    		}
                    	}
                    );
				await Promise.all(settledQueryMetricsValuePromise);
				queryMetricsValuePromise = [];
				totalQueiresPromise = [];
			}
		}
	}
	return {
		control: queryControlNDCG,
		experiment: queryExperimentNDCG,
		status: anyQueryComputationFailed,
	};
}

async function setUpdateProcessingToFalse(db: any, querysetID: number) {
	const query =
        'UPDATE querysetmetrics \
        SET metricupdateprocessing = false \
        WHERE querysetid = $1 and querysetmetricsname = \'avg_ndcg\'';
	const prepareResult = new PreparedStatement({
		name: 'setUpdateProcessingTofalse',
		text: query,
		values: [querysetID],
	});
	await db.none(prepareResult);
}

async function runPythonScript(
	controlRatingToPass: {},
	experimentRatingToPass: {},
	allRatingToPass: {}
) {
	const { PythonShell } = require('python-shell');
	let resultFromPython = '';
	const pythonFolder = path.join(__dirname, '../python/');
	PythonShell.defaultOptions = {
		scriptPath: pythonFolder,
		pythonPath: '/usr/local/bin/python',
		pythonOptions: ['-u'],
	};

	return new Promise((resolve, reject) => {
		const shell = new PythonShell('ndcg.py');
		shell.send(JSON.stringify(controlRatingToPass), { mode: 'json' });
		shell.send(JSON.stringify(experimentRatingToPass), { mode: 'json' });
		shell.send(JSON.stringify(allRatingToPass), { mode: 'json' });

		shell.on('message', function (message: any) {
			// handle message (a line of text from stdout, parsed as JSON)
			console.log(message);
			if (message.includes('final')) {
				resultFromPython = message;
			}
		});
		shell.on('data', function (message: any) {
			console.log(message);
		});
		shell.on('error', function (message: any) {
			console.log(message);
		});
		shell.end((err: any) => {
			if (err) {
				console.log(err);
				reject(err);
			} else {
				console.log('python ended');
				resolve(resultFromPython);
			}
		});
	});
}

async function updateQuerySetMetrics(
	db: any,
	querysetID: number,
	queryControlNDCG: Array<number>,
	queryExperimentNDCG: Array<number>
) {
	try {
		//calcualte query set metrics
		let sum = queryControlNDCG.reduce((a, b) => a + b, 0);
		const querysetControlNDCG = sum / queryControlNDCG.length || 0;

		sum = queryExperimentNDCG.reduce((a, b) => a + b, 0);
		const querysetExperimentNDCG = sum / queryExperimentNDCG.length || 0;

		await updateQuerySetMetricsAfterCalculation(
			db,
			querysetID,
			querysetControlNDCG,
			querysetExperimentNDCG,
			sum
		);
	} catch (err) {
		console.log(
			'error in update NDCG - compute queryset metric : ' + err.message
				? err.message
				: err
		);
		setUpdateProcessingToFalse(db, querysetID);
	}
}

async function processResultIdsToGet(
	db: any,
	resultIdsToGet: Array<number>,
	controlRatingPairs: Array<Object>,
	experimentRatingPairs: Array<Object>,
	allRatings: Array<string>,
	querysetID: number
) {
	for (const resultID of resultIdsToGet) {
		try {
			let query =
                'SELECT aggregatedvalue, valuefloat FROM resultratings \
            JOIN valuetable on resultratings.aggregatedvalue = valuetable.valuetableid \
       WHERE queryresultsid = $1 AND resultratingname = \'rating\'';
			const prepareRating = new PreparedStatement({
				name: 'select-rating',
				text: query,
				values: [resultID],
			});
			const rating = await db.one(prepareRating);
			if (rating) {
				query =
                    'SELECT sidemetadatatype,sidemetadatarank,excludefrommainmetrics \
        FROM resultsidemetadata \
        WHERE queryresultsid = $1';
				const prepareRank = new PreparedStatement({
					name: 'select-rank',
					text: query,
					values: [resultID],
				});
				const rank = await db.any(prepareRank);
				let found = false;
				for (const eachRank of rank) {
					if (
						eachRank.sidemetadatarank &&
                        eachRank.excludefrommainmetrics === false
					) {
						if (eachRank.sidemetadatatype === 'Control') {
							const JSONObj = {};
							JSONObj[parseInt(eachRank.sidemetadatarank)] =
                                rating.valuefloat;
							controlRatingPairs.push(JSONObj);
							found = true;
						} else if (eachRank.sidemetadatatype === 'Experiment') {
							const JSONObj = {};
							JSONObj[parseInt(eachRank.sidemetadatarank)] =
                                rating.valuefloat;
							experimentRatingPairs.push(JSONObj);
							found = true;
						}
					}
				}
				//only add the rating if this result is supposed to be included for either the control or experiment
				if (found) {
					allRatings.push(rating.valuefloat);
				}
			}
		} catch (err) {
			console.log(
				'error in update NDCG - process result : ' +
                    resultID +
                    ':' +
                    err.message
					? err.message
					: err
			);
			setUpdateProcessingToFalse(db, querysetID);
		}
	}
}

async function updateQuerySetMetricsAfterCalculation(
	db: any,
	querysetID: number,
	querysetControlNDCG: number,
	querysetExperimentNDCG: number,
	sum: number
) {
	try {
		//update query set metrics
		const updatePromise = [];
		let query =
            'SELECT querysetmetricscontrolvalue, querysetmetricsexperimentvalue,querysetmetricsdefaultvalue FROM querysetmetrics \
          WHERE querysetid = $1 AND querysetmetricsname = \'avg_ndcg\'';
		const prepareQsetValueTableIDs = new PreparedStatement({
			name: 'select-control-experiment-values',
			text: query,
			values: [querysetID],
		});
		const qsetValueTableIDs = await db.one(prepareQsetValueTableIDs);
		if (qsetValueTableIDs) {
			if (sum == 0) {
				//experiment values are zero, treat as single side
				query =
                    'UPDATE valuetable SET valuefloat = $1, invaliddata=false WHERE valuetableid = $2';
				const prepareQuerysetMetricsDefaultValue =
                    new PreparedStatement({
                    	name: 'update-querysetmetricsdefaultvalue',
                    	text: query,
                    	values: [
                    		querysetControlNDCG,
                    		qsetValueTableIDs.querysetmetricsdefaultvalue,
                    	],
                    });
				const result = db.none(prepareQuerysetMetricsDefaultValue);
				updatePromise.push(result);
			} else {
				query =
                    'UPDATE valuetable SET valuefloat = $1, invaliddata=false WHERE valuetableid = $2';
				const prepareQuerysetMetricsControlValue =
                    new PreparedStatement({
                    	name: 'update-querysetmetricscontrolvalue',
                    	text: query,
                    	values: [
                    		querysetControlNDCG,
                    		qsetValueTableIDs.querysetmetricscontrolvalue,
                    	],
                    });
				let result = db.none(prepareQuerysetMetricsControlValue);
				updatePromise.push(result);

				query =
                    'UPDATE valuetable SET valuefloat = $1, invaliddata=false WHERE valuetableid = $2';
				const prepareQuerysetMetricsExperimentValue =
                    new PreparedStatement({
                    	name: 'update-querysetmetricsexperimentvalue',
                    	text: query,
                    	values: [
                    		querysetExperimentNDCG,
                    		qsetValueTableIDs.querysetmetricsexperimentvalue,
                    	],
                    });
				result = db.none(prepareQuerysetMetricsExperimentValue);
				updatePromise.push(result);
			}
		}
		//clear invaliddata flag
		query =
            'UPDATE querysetmetrics SET invaliddata = false,metricupdateprocessing=false WHERE querysetid = $1 and querysetmetricsname=\'avg_ndcg\'';
		const prepareClearFlag = new PreparedStatement({
			name: 'update-invaliddata-and-metricupdateprocessing',
			text: query,
			values: [querysetID],
		});
		let result = db.none(prepareClearFlag);
		updatePromise.push(result);

		query =
            'UPDATE querysetmetrics \
        SET metricupdateprocessing = false \
        WHERE querysetid = $1 and querysetmetricsname = \'avg_ndcg\'';
		const prepareMetricuUdateProcessing = new PreparedStatement({
			name: 'update-metricupdateprocessing-false',
			text: query,
			values: [querysetID],
		});
		result = db.none(prepareMetricuUdateProcessing);
		updatePromise.push(result);
		await Promise.all(updatePromise);
	} catch (err) {
		console.log(
			'error in update NDCG - update queryset metric : ' + err.message
				? err.message
				: err
		);
		setUpdateProcessingToFalse(db, querysetID);
	}
}

function computeRating(pageMatch: integer | null, pageQuality: integer | null) {
	let rating: integer = 0;
	switch (pageMatch) {
	case 3:
		switch (pageQuality) {
		case 2:
		case 1:
			rating = 3;
			break;
		case 0:
			rating = 0;
			break;
		default:
			rating = 0;
		}
		break;
	case 2:
		switch (pageQuality) {
		case 2:
			rating = 2;
			break;
		case 1:
			rating = 1;
			break;
		case 0:
			rating = 0;
			break;
		}
		break;
	case 1:
		switch (pageQuality) {
		case 2:
		case 1:
			rating = 1;
			break;
		case 0:
			rating = 0;
			break;
		default:
			rating = 0;
		}
		break;
	case 0:
		rating = 0;
		break;
	case -1:
		rating = 0;
		break;
	default:
		rating = 0;
	}
	return rating;
}

async function updateRatingQueryResultID(
	db: any,
	ratingName: string,
	queryResultID: { queryresultsid: number }
) {
	//if ratingName is page_match or page_quality update rating and continue
	if (ratingName === 'page_match' || ratingName === 'page_quality') {
		console.time('selecting resultrating and valuetable =>');
		const prepareResult = new PreparedStatement({
			name: 'get-result',
			text: 'SELECT resultratingsid,resultratingname,overridevalue, \
      valuetable.valuebool,valuetable.valuefloat,valuetable.valuestring \
      FROM  resultratings \
      JOIN valuetable on valuetable.valuetableid = resultratings.overridevalue \
      WHERE resultratings.queryresultsid = $1',
			values: [queryResultID[0].queryresultsid],
		});
		let result = await db.many(prepareResult);
		console.timeEnd('selecting resultrating and valuetable =>');
		let pageMatch: float | null = null,
			pageQuality: float | null = null,
			rating: float,
			ratingID: integer | null = null;
		console.time('total time in the loop =>');
		for await (const eachRating of result) {
			if (eachRating.resultratingname === 'page_quality') {
				pageQuality = eachRating.valuefloat;
			} else if (eachRating.resultratingname === 'page_match') {
				pageMatch = eachRating.valuefloat;
			} else if (eachRating.resultratingname === 'rating') {
				ratingID = eachRating.overridevalue;
			}
		}
		console.timeEnd('total time in the loop =>');

		if (ratingID) {
			rating = computeRating(pageMatch, pageQuality);
			console.time('updating ratingID if present =>');
			const prepareResult = new PreparedStatement({
				name: 'update-valuetable',
				text: 'UPDATE valuetable \
          SET valuefloat = $1 \
          WHERE valuetableid = $2',
				values: [rating, ratingID],
			});
			result = await db.none(prepareResult);
			console.timeEnd('updating ratingID if present =>');
		}
	} else {
		// else, just continue to mark ndcg invalid as rating is updated
	}
	//mark querymetrics as invalid data
	console.time('marked invalid for ndcg =>');
	const prepareResult = new PreparedStatement({
		name: 'update-querymetrics-invalid',
		text: 'UPDATE querymetrics set invaliddata = true where queriesid = $1 and querymetricsname=\'ndcg\'',
		values: [queryResultID[0].queriesid],
	});
	await db.none(prepareResult);
	console.timeEnd('marked invalid for ndcg =>');

	//mark query setmetrics as invalid data
	console.time('marked invalid for avg_ndcg =>');
	const prepareUpdateValueTable = new PreparedStatement({
		name: 'update-querysetmetrics-invalid',
		text: 'UPDATE querysetmetrics set invaliddata = true where querysetid = $1 and querysetmetricsname=\'avg_ndcg\'',
		values: [queryResultID[0].querysetid],
	});
	await db.none(prepareUpdateValueTable);
	console.timeEnd('marked invalid for avg_ndcg =>');
}

async function callUpdateValueTablePromises(
	db: any,
	queriesid: number,
	rating: string,
	res: commonReqResInterface,
	sidebysideratingsid: number
) {
	const updateValueTablePromises = [];
	let queryString = '';
	//update rating inside queryrating override value
	queryString =
        'SELECT overridevalue FROM queryratings WHERE queriesid = $1 and queryratingname = \'compare_A_B\'';
	console.time('selecting override value =>');
	const prepareResults = new PreparedStatement({
		name: 'get-ovverridevalue',
		text: queryString,
		values: [queriesid],
	});
	let results = await db.many(prepareResults);
	console.timeEnd('selecting override value =>');

	if (results.length == 0 || results.length > 1) {
		let message = '';
		if (results.length == 0) {
			message = 'Error in updating rating. Could not find id to update';
		} else {
			message =
                'Error in updating rating. Found multiple values with same id';
		}
		res.status(500).json({ status: 500, message: message });
		return;
	}
	queryString =
        'UPDATE valuetable SET valuestring = $1 WHERE valuetableid = $2';
	const prepareUpdateValuetable = new PreparedStatement({
		name: 'update-valuetable',
		text: queryString,
		values: [rating, results[0].overridevalue],
	});
	results = db.none(prepareUpdateValuetable);
	updateValueTablePromises.push(results);

	//update rating is side by side rating table
	let updateResults;
	if (sidebysideratingsid == null) {
		queryString =
            'INSERT INTO sidebysideratings \
       (queriesid,ratingtext) \
       VALUES ($1,$2)';
		const prepareUpdateResults = new PreparedStatement({
			name: 'insert-sidebysideratings',
			text: queryString,
			values: [queriesid, rating],
		});
		updateResults = db.none(prepareUpdateResults);
		updateValueTablePromises.push(updateResults);
	} else {
		queryString =
            'UPDATE sidebysideratings SET ratingtext = $1 WHERE sidebysideratingsid = $2';
		const prepareUpdateResults = new PreparedStatement({
			name: 'update-sidebysideratings',
			text: queryString,
			values: [rating, sidebysideratingsid],
		});
		updateResults = db.none(prepareUpdateResults);
		updateValueTablePromises.push(updateResults);
	}
	await Promise.all(updateValueTablePromises);
	return true
}

async function callResultAndResultIDS(db: any, queriesid: number) {
	const selectValuesPromise = [];
	let queryString = 'SELECT querysetid FROM queries WHERE queriesid = $1';
	console.time('selecting querysetid =>');
	const prepareResult = new PreparedStatement({
		name: 'select-querysetid',
		text: queryString,
		values: [queriesid],
	});
	let results = await db.any(prepareResult);
	console.timeEnd('selecting querysetid =>');

	const querySetID = results[0].querysetid;
	queryString =
        'SELECT COUNT(*),valuetable.valuestring \
      FROM queries \
      LEFT JOIN queryratings ON queries.queriesid=queryratings.queriesid \
      LEFT JOIN valuetable ON valuetable.valuetableid = queryratings.overridevalue \
      WHERE queries.querysetid = $1 and queryratings.queryratingname = \'compare_A_B\' \
      GROUP BY valuetable.valuestring \
      ORDER BY valuetable.valuestring ';
	const prepareJoinResults = new PreparedStatement({
		name: 'get-result-with-join',
		text: queryString,
		values: [querySetID],
	});
	results = db.many(prepareJoinResults);
	selectValuesPromise.push(results);

	queryString =
        'SELECT querysetmetrics.querysetmetricsname,querysetmetrics.querysetmetricsdefaultvalue \
      FROM  querysetmetrics WHERE (querysetmetricsname = \'much_better\' OR querysetmetricsname = \'better\' \
      OR querysetmetricsname = \'equal\' OR querysetmetricsname = \'worse\' \
      OR querysetmetricsname = \'much_worse\') AND querysetid = $1 \
      ORDER BY querysetmetrics.querysetmetricsname';
	const prepareResultIDS = new PreparedStatement({
		name: 'select-IDS',
		text: queryString,
		values: [querySetID],
	});
	let resultIDS = db.any(prepareResultIDS);
	selectValuesPromise.push(resultIDS);
	[results, resultIDS] = await Promise.all(selectValuesPromise);
	return [results, resultIDS, querySetID];
}

async function callRatingsToCheck(
	db: any,
	results: Array<{}>,
	resultIDS: Array<{}>
) {
	const ratingsToCheck = [
		'much_better',
		'better',
		'equal',
		'worse',
		'much_worse',
	];

	let valueToUpdate: integer, idToUpdate: integer;
	const updateValueTablePromise: Array<string> = [];
	let queryString = '';
	results.map((eachResult: { count: number; valuestring: string }) => {
		valueToUpdate = eachResult.count;
		resultIDS.map(
			(eachID: {
                querysetmetricsname: string;
                querysetmetricsdefaultvalue: number;
            }) => {
				if (eachID.querysetmetricsname === eachResult.valuestring) {
					const index = ratingsToCheck.indexOf(
						eachID.querysetmetricsname
					);
					if (index > -1) {
						ratingsToCheck.splice(index, 1);
					}

					idToUpdate = eachID.querysetmetricsdefaultvalue;
					if (!valueToUpdate) {
						valueToUpdate = 0;
					}
					if (idToUpdate) {
						queryString =
                            'UPDATE valuetable SET valuefloat = $1 WHERE valuetableid = $2';
						const prepareUpdateRes = new PreparedStatement({
							name: 'update-valuetable-inside-loop',
							text: queryString,
							values: [valueToUpdate, idToUpdate],
						});
						const updateRes = db.none(prepareUpdateRes);
						updateValueTablePromise.push(updateRes);
					}
				}
			}
		);
	});
	await Promise.all(updateValueTablePromise);

	if (ratingsToCheck.length > 0) {
		const resetValuesPromise: Array<string> = [];
		//reset count of ratings not present to zero
		ratingsToCheck.map((eachRating) => {
			resultIDS.map(
				(eachID: {
                    querysetmetricsname: string;
                    querysetmetricsdefaultvalue: string;
                }) => {
					if (eachID.querysetmetricsname === eachRating) {
						queryString =
                            'UPDATE valuetable SET valuefloat = $1 WHERE valuetableid = $2';
						const prepareUpdateRes = new PreparedStatement({
							name: 'update-reset-values',
							text: queryString,
							values: [0, eachID.querysetmetricsdefaultvalue],
						});
						const updateRes = db.none(prepareUpdateRes);
						resetValuesPromise.push(updateRes);
					}
				}
			);
		});
		await Promise.all(resetValuesPromise);
	}
}

async function calledSettledTotalQueiresPromise(
	db: any,
	settledTotalQueiresPromise: Array<{ length: number }>,
	eachQuery: { queryresultsidlist: number; queriesid: number },
	querysetID: number,
	queryControlNDCG: Array<number>,
	queryExperimentNDCG: Array<number>,
	anyQueryComputationFailed: boolean,
	queryMetricsValuePromise: Array<string>
) {
	try {
		const totalQueriesPromise = settledTotalQueiresPromise.map(
			async (needToUpdateMetric) => {
				if (
					needToUpdateMetric &&
                    needToUpdateMetric.length > 0 &&
                    needToUpdateMetric[0].invaliddata
				) {
					const allRatings: Array<string> = [];
					const controlRatingPairs: Array<string> = [];
					const experimentRatingPairs: Array<string> = [];

					const resultIdsToGet = JSON.parse(
						'[' + eachQuery.queryresultsidlist + ']'
					);

					await processResultIdsToGet(
						db,
						resultIdsToGet,
						controlRatingPairs,
						experimentRatingPairs,
						allRatings,
						querysetID
					);

					//all data needed for NDCG of query is ready, call python
					const allRatingToPass = { rating: allRatings };
					const controlRatingToPass = { rating: controlRatingPairs };
					const experimentRatingToPass = {
						rating: experimentRatingPairs,
					};

					let resultFromPython: any;
					let control_ndcg, experiment_ndcg;

					try {
						//run python
						const promise = await runPythonScript(
							controlRatingToPass,
							experimentRatingToPass,
							allRatingToPass
						);

						//returns control and exp ndcg, update to querymetricscontrolvalue and querymetricsexperimentvalue
						resultFromPython = promise;
						const JSONresult = JSON.parse(resultFromPython);
						control_ndcg = JSONresult.controlVal;
						experiment_ndcg = JSONresult.experimentVal;
						queryControlNDCG.push(control_ndcg);
						queryExperimentNDCG.push(experiment_ndcg);
					} catch (err) {
						console.log(
							'error in update NDCG - update metric through python : ' +
                                err.message
								? err.message
								: err
						);
						setUpdateProcessingToFalse(db, querysetID);
						anyQueryComputationFailed = true;
					}
					if (!anyQueryComputationFailed) {
						await calledAtAnyQueryComputationFailed(
							db,
							querysetID,
							eachQuery,
							control_ndcg,
							experiment_ndcg
						);
					}
				} else {
					//get metric from database for eachQuery.queriesid
					const query =
                        'SELECT querymetricscontrolvalue, querymetricsexperimentvalue FROM querymetrics \
          WHERE queriesid = $1';
					const prepareValutableids = new PreparedStatement({
						name: 'select-control-experiment-value',
						text: query,
						values: [eachQuery.queriesid],
					});
					const valutableids = db.any(prepareValutableids);
					queryMetricsValuePromise.push(valutableids);
				}
			}
		);
		await Promise.all(totalQueriesPromise);
		return anyQueryComputationFailed;
	} catch (err) {
		console.log(
			'error in update NDCG - update query metric : ' + err.message
				? err.message
				: err
		);
		setUpdateProcessingToFalse(db, querysetID);
		return anyQueryComputationFailed;
	}
}

async function calledAtAnyQueryComputationFailed(
	db: any,
	querysetID: number,
	eachQuery: { queryresultsidlist: number; queriesid: number },
	control_ndcg: Array<string>,
	experiment_ndcg: Array<string>
) {
	try {
		//update query metrics
		let query =
            'SELECT querymetricscontrolvalue, querymetricsexperimentvalue FROM querymetrics \
          WHERE queriesid = $1';
		const prepareSelectQueryMetrics = new PreparedStatement({
			name: 'update-prepareSelectQueryMetrics',
			text: query,
			values: [eachQuery.queriesid],
		});
		const valutableids = await db.any(prepareSelectQueryMetrics);
		if (valutableids) {
			for (const eachValuetableids of valutableids) {
				query =
                    'UPDATE valuetable SET valuefloat = $1, invaliddata=false  WHERE valuetableid = $2';
				const prepareUpdateValueTableControl = new PreparedStatement({
					name: 'update-prepareUpdateValueTableControl',
					text: query,
					values: [
						control_ndcg,
						eachValuetableids.querymetricscontrolvalue,
					],
				});

				await db.none(prepareUpdateValueTableControl);

				query =
                    'UPDATE valuetable SET valuefloat = $1, invaliddata=false WHERE valuetableid = $2';
				const prepareUpdateValueTableExperiment = new PreparedStatement(
					{
						name: 'update-prepareUpdateValueTableExperiment',
						text: query,
						values: [
							experiment_ndcg,
							eachValuetableids.querymetricsexperimentvalue,
						],
					}
				);

				await db.none(prepareUpdateValueTableExperiment);
			}
		}

		query =
            'UPDATE querymetrics SET invaliddata = false WHERE queriesid = $1 and querymetricsname=\'ndcg\'';
		const prepareUpdateQuerymetricsNDCG = new PreparedStatement({
			name: 'update-prepareUpdateQuerymetricsNDCG',
			text: query,
			values: [eachQuery.queriesid],
		});
		await db.none(prepareUpdateQuerymetricsNDCG);
	} catch (err) {
		console.log(
			'error in update NDCG - update query metric : ' + err.message
				? err.message
				: err
		);
		setUpdateProcessingToFalse(db, querysetID);
	}
}
