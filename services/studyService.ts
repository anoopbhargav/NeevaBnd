import { PreparedStatement } from 'pg-promise';
import { getConnection } from '../db';
import {
	getQueryresultsInterface,
	getSideBySideQueryResultsListInterface,
	getSideBySideResultsInterface,
	addNotesInterface,
	getAllNotesInterface,
	getSingleSideResultsInterface,
	getQuerysetsInterface,
	getQueriesInterface,
	getQueryresultsListSideBySideInterface,
} from '../models/interface/studyInterface';
import { commonReqResInterface } from '../models/interface/commonReqResInterface';
let preparedStatementUniqueName = 0;

export const getQueriesList = async (
	getQueriesData: getQueriesInterface,
	res: commonReqResInterface
) => {
	const {
		fromSideBySide,
		itemsPerPage,
		pagenumber,
		querysetid,
		page,
		filterValueMax,
		filterValueMin,
		filterParam,
		sortingOrder,
		sortingParam,
		querytags,
		querytagstype,
		searchParam,
	} = getQueriesData;
	console.log('in the get-queries');
	console.time('total');
	const db = await getConnection();
	try {
		const controlResults: Array<string> = [];
		const expResults: Array<string> = [];
		let queryString: string = getQueriesListFilterSortingQuery(
			sortingParam,
			filterParam,
			querytags
		);

		//for filtering by range
		const [returnedQueryString, totalCountPromise] =
            await getQueriesListPromise(
            	db,
            	queryString,
            	filterParam,
            	filterValueMax,
            	filterValueMin,
            	searchParam,
            	querytags,
            	querytagstype,
            	sortingParam,
            	sortingOrder,
            	querysetid,
            	pagenumber,
            	itemsPerPage
            );
		queryString = returnedQueryString;

		const [totalCount, queries, sortParams, queryCount, filterParams] =
            await getQueriesList5QueriesPromise(
            	db,
            	queryString,
            	querysetid,
            	totalCountPromise
            );

		const [filteredSortParams, queryTagParams] =
            await getQueriesListFilteredData(
            	db,
            	sortParams,
            	page,
            	queries,
            	queryCount,
            	itemsPerPage,
            	filterParams
            );

		if (queries.length > 0) {
			await getQueriesListQueries(
				db,
				queries,
				fromSideBySide,
				controlResults,
				expResults
			);
		}
		console.timeEnd('total');

		if (queries) {
			res.status(200).json({
				status: 200,
				totalqueries: totalCount,
				queries: queries,
				sortparams: filteredSortParams,
				pagenum: queryCount,
				filterparams: filterParams,
				querytagparams: queryTagParams,
				controlresults: controlResults,
				expresults: expResults,
			});
		} else {
			res.status(400).json({
				status: 400,
				message: 'Error in fetching queries',
			});
		}
	} catch (err) {
		console.log('error in getQueriesList : ' + err);
		res.status(500).json({
			status: 500,
			message:
                'error in getQueriesList:' + err.message ? err.message : err,
		});
	}
};

export const getQuerysetsList = async (
	getQuerysetsListData: getQuerysetsInterface,
	res: commonReqResInterface
) => {
	console.log('in the get-querysets');
	console.time('total');
	const db = await getConnection();
	try {
		const {
			itemsPerPage,
			pagenumber,
			filterValueMax,
			filterValueMin,
			querysettype,
			filterParam,
			sortingOrder,
			sortingParam,
			searchParam,
		} = getQuerysetsListData;
		let queryString: string = getQuerysetsListFilterSortingQuery(
			sortingParam,
			filterParam
		);

		//for filtering by range
		const [returnedQueryString, totalCountPromise] =
            await getQuerysets4QueriesPromise(
            	db,
            	queryString,
            	filterParam,
            	searchParam,
            	filterValueMax,
            	filterValueMin,
            	sortingParam,
            	sortingOrder,
            	querysettype,
            	pagenumber,
            	itemsPerPage
            );
		queryString = returnedQueryString;

		const [totalCount, querySets, querySetCount, filteredSortParams] =
            await getQuerysetsList4QueriesPromise(
            	db,
            	queryString,
            	querysettype,
            	itemsPerPage,
            	totalCountPromise
            );

		if (querySets.length > 0) {
			//get all metrics
			const [queryMetrics, queryTags] =
                await getQuerysetsList2QueriesPromise(
                	db,
                	querySets,
                	querysettype
                );
			await getQuerysetsListMapQuerySets(
				querySets,
				queryMetrics,
				queryTags
			);
		}
		console.timeEnd('total');

		if (querySets)
			res.status(200).json({
				status: 200,
				querysets: querySets,
				sortparams: filteredSortParams,
				pagenum: querySetCount,
				totalcount: totalCount,
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in fetching querysets',
			});
	} catch (err) {
		console.log('error in getQuerysetsList : ' + err);
		res.status(500).json({
			status: 500,
			message:
                'error in getQuerysetsList:' + err.message ? err.message : err,
		});
	}
};

export const getQueryresultsList = async (
	getQueryresultsData: getQueryresultsInterface,
	res: commonReqResInterface
) => {
	console.log('in the get-results');
	console.time('total');
	const db = await getConnection();
	try {
		const { itemsPerPage, pagenumber, queriesid, searchParam } =
            getQueryresultsData;
		const [resultCountVariable, queryResults, queryDetails] =
            await getQueryresultsListQueries(
            	db,
            	searchParam,
            	queriesid,
            	pagenumber,
            	itemsPerPage
            );

		const totalCount = resultCountVariable.length;
		const resultCount = Math.ceil(
			parseInt(resultCountVariable.length) / itemsPerPage
		);

		let queryString =
            'SELECT  resultratingsid, queryresultsid, resultratingname,ratingscale, ratingtype, \
valuebool as overridevaluebool, valuestring as overridevaluestring, valuefloat as overridevaluefloat \
FROM resultratings \
JOIN valuetable on valuetable.valuetableid = resultratings.overridevalue \
WHERE ';

		let whereClause = '';
		queryResults.map((eachRes: any) => {
			whereClause += ' OR queryresultsid = ' + eachRes.queryresultsid;
		});
		whereClause = whereClause.substring(4);
		queryString = queryString.concat(whereClause);
		queryString += ' ORDER BY resultratingname';

		const prepareResultMetrics = new PreparedStatement({
			name: `get-${preparedStatementUniqueName}-ResultMetrics`,
			text: `${queryString}`,
		});
		const resultMetrics = await db.many(prepareResultMetrics);
		preparedStatementUniqueName += 1;

		queryResults.map((eachRes: any) => {
			eachRes['resultmetric'] = [];
			resultMetrics.map((eachMetric: any) => {
				if (eachRes.queryresultsid === eachMetric.queryresultsid) {
					eachRes['resultmetric'].push(eachMetric);
				}
			});
		});

		queryString = '';

		if (queryResults)
			res.status(200).json({
				status: 200,
				queryresults: queryResults,
				querydetails: queryDetails[0],
				pagenum: resultCount,
				totalcount: totalCount,
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in fetching queryresults',
			});
	} catch (err) {
		console.log('error in getQueryresultsList : ' + err);
		if (err.message) {
			res.status(500).json({
				status: 500,
				message: 'error in getQueryresultsList:' + err.message,
			});
		} else {
			res.status(500).json({
				status: 500,
				message: 'error in getQueryresultsList:' + err,
			});
		}
	}
};

export const getQueryresultsListSideBySide = async (
	getQueryresultsListSideBySideData: getQueryresultsListSideBySideInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { searchParam, queriesid, itemsPerPage, pagenumber } =
            getQueryresultsListSideBySideData;
		const [resultCount, queryResults] =
            await getQueryresultsListSideBySideQueryResults(
            	db,
            	searchParam,
            	queriesid,
            	itemsPerPage,
            	pagenumber
            );
		if (queryResults.length > 0) {
			let queryString =
                'SELECT  resultratingsid, queryresultsid, resultratingname,ratingscale, ratingtype, \
valuebool as overridevaluebool, valuestring as overridevaluestring, valuefloat as overridevaluefloat \
FROM resultratings \
JOIN valuetable on valuetable.valuetableid = resultratings.overridevalue \
WHERE ';

			let whereClause = '';
			queryResults.map((eachRes: any) => {
				whereClause += ' OR queryresultsid = ' + eachRes.queryresultsid;
			});
			whereClause = whereClause.substring(4);
			queryString = queryString.concat(whereClause);
			queryString += ' ORDER BY resultratingname';

			const prepareResultMetrics = new PreparedStatement({
				name: `getQuepreparedStatementUniqueNameryResultsListSideBySide-${preparedStatementUniqueName}-prepareResultMetrics`,
				text: queryString,
			});
			const resultMetrics = await db.any(prepareResultMetrics);
			preparedStatementUniqueName += 1;

			queryResults.map((eachRes: any) => {
				eachRes['resultmetric'] = [];
				resultMetrics.map((eachMetric: any) => {
					if (eachRes.queryresultsid === eachMetric.queryresultsid) {
						eachRes['resultmetric'].push(eachMetric);
					}
				});
			});
		}

		if (queryResults)
			res.status(200).json({
				status: 200,
				queryresults: queryResults,
				pagenum: resultCount,
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in fetching queryresults',
			});
	} catch (err) {
		console.log('error in getQueryresultsListSideBySide : ' + err);
		res.status(500).json({
			status: 500,
			message: 'error in getQueryresultsListSideBySide:' + err,
		});
	}
};

export const getSingleSideResults = async (
	getSingleSideResultsData: getSingleSideResultsInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { queryresultsid, queryside } = getSingleSideResultsData;
		let queryString = '';

		if (queryside === 'Experiment') {
			queryString =
                'SELECT actionurl,resultid,scalerank,segments,snippet,title,typename,universaltype, \
      sidemetadatatype, sidemetadatadocsignals, sidemetadatarank, resultsidemetadata.excludefrommainmetrics, resultsidemetadata.koalascore, resultsidemetadata.koalashard \
         FROM queryresults \
         LEFT JOIN resultsidemetadata \
         ON resultsidemetadata.queryresultsid = queryresults.queryresultsid \
         WHERE sidemetadatatype = \'Experiment\' AND queryresults.queryresultsid=$1';
		} else {
			queryString =
                'SELECT actionurl,resultid,scalerank,segments,snippet,title,typename,universaltype, \
      sidemetadatatype, sidemetadatadocsignals, sidemetadatarank, resultsidemetadata.excludefrommainmetrics, resultsidemetadata.koalascore, resultsidemetadata.koalashard \
         FROM queryresults \
         LEFT JOIN resultsidemetadata \
         ON resultsidemetadata.queryresultsid = queryresults.queryresultsid \
         WHERE sidemetadatatype = \'Control\' AND queryresults.queryresultsid=$1';
		}
		const prepareResult = new PreparedStatement({
			name: `get-${preparedStatementUniqueName}-queryset-result`,
			text: queryString,
			values: [queryresultsid],
		});
		const results = await db.any(prepareResult);
		preparedStatementUniqueName += 1;

		queryString =
            'SELECT  resultratingsid, resultratings.queryresultsid, resultratingname, ratingscale, ratingtype, \
valuebool as overridevaluebool, valuestring as overridevaluestring, valuefloat as overridevaluefloat, resultsidemetadata.excludefrommainmetrics, resultsidemetadata.koalascore, resultsidemetadata.koalashard \
FROM resultratings \
JOIN valuetable on valuetable.valuetableid = resultratings.overridevalue \
LEFT JOIN resultsidemetadata \
         ON resultsidemetadata.queryresultsid = resultratings.queryresultsid \
WHERE resultratings.queryresultsid = $1';
		if (queryside === 'Experiment') {
			queryString += ' AND  sidemetadatatype = \'Experiment\'';
		} else {
			queryString += ' AND  sidemetadatatype = \'Control\'';
		}
		queryString += ' ORDER BY resultratingname';

		const prepareResultMetrics = new PreparedStatement({
			name: `get-${preparedStatementUniqueName}-queryset-ResultMetrics`,
			text: queryString,
			values: [queryresultsid],
		});
		const resultMetrics = await db.any(prepareResultMetrics);
		preparedStatementUniqueName += 1;
		if (results)
			res.status(200).json({
				status: 200,
				resultdetails: results,
				resultmetrics: resultMetrics,
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in fetching single side results',
			});
	} catch (err) {
		console.log('error in getSingleSideResults : ' + err);
		res.status(500).json({
			status: 500,
			message:
                'error in getSingleSideResults:' + err.message
                	? err.message
                	: err,
		});
	}
};

export const getSideBySideResults = async (
	getSideBySideResultsData: getSideBySideResultsInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { queryresultsidcontrol, queryresultsidexp } =
            getSideBySideResultsData;
		const [controlResults, resultMetricsControl] =
            await getSideBySideResultsControlResult(db, queryresultsidcontrol);
		const [expResults, resultMetricsExperiment] =
            await getSideBySideResultsExpResult(db, queryresultsidexp);

		if (
			controlResults[0].sidemetadatadocsignals !== null &&
            expResults[0].sidemetadatadocsignals !== null
		) {
			const docSignals1 = controlResults[0].sidemetadatadocsignals;
			const docSignals2 = expResults[0].sidemetadatadocsignals;

			let jsonObject1 = JSON.parse(docSignals1);
			let jsonObject2 = JSON.parse(docSignals2);

			const missingKeyTag = tagMissingKeys(jsonObject1, jsonObject2);
			jsonObject1 = missingKeyTag[0];
			jsonObject2 = missingKeyTag[1];

			const missingKeyTag2 = tagMissingKeys(jsonObject2, jsonObject1);
			jsonObject2 = missingKeyTag2[0];
			jsonObject1 = missingKeyTag2[1];

			const markedData = addMark(jsonObject1, jsonObject2);
			jsonObject1 = markedData[0];
			jsonObject2 = markedData[1];

			controlResults[0].sidemetadatadocsignals =
                JSON.stringify(jsonObject1);
			expResults[0].sidemetadatadocsignals = JSON.stringify(jsonObject2);
		}
		if (expResults)
			res.status(200).json({
				status: 200,
				controlresults: controlResults,
				expresults: expResults,
				resultmetricscontrol: resultMetricsControl,
				resultmetricsexperiment: resultMetricsExperiment,
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in fetching side by side results',
			});
	} catch (err) {
		console.log('error in getSideBySideResults : ' + err);
		res.status(500).json({
			status: 500,
			message:
                'error in getSideBySideResults:' + err.message
                	? err.message
                	: err,
		});
	}
};

function addMark(obj1: {}, obj2: {}) {
	const keys = Object.keys(obj1);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		try {
			if (
				typeof obj1[key] === 'object' &&
                Object.prototype.hasOwnProperty.call(obj2, key)
			) {
				const markData = addMark(obj1[key], obj2[key]);
				obj1[key] = markData[0];
				obj2[key] = markData[1];
			} else {
				if (
					Object.prototype.hasOwnProperty.call(obj2, key) &&
                    obj1[key] != obj2[key]
				) {
					obj1[key] = '<mark>' + obj1[key] + '</mark>';
					obj2[key] = '<mark>' + obj2[key] + '</mark>';
				}
			}
		} catch (err) {
			console.log('err in addMark', err);
		}
	}
	return [obj1, obj2];
}

function tagMissingKeys(obj1: {}, obj2: {}) {
	const keys = Object.keys(obj1);
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		try {
			if (
				typeof obj1[key] === 'object' &&
                Object.prototype.hasOwnProperty.call(obj2, key)
			) {
				const markData = tagMissingKeys(obj1[key], obj2[key]);
				obj1[key] = markData[0];
				obj2[key] = markData[1];
			} else {
				if (!Object.prototype.hasOwnProperty.call(obj2, key)) {
					obj2[key] = '<mark> Missing key </mark>';
				}
			}
		} catch (err) {
			console.log('err in tag missing keys', err);
		}
	}
	return [obj1, obj2];
}

export const getSideBySideQueryResultsList = async (
	getSideBySideQueryResultsListData: getSideBySideQueryResultsListInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { queriesid } = getSideBySideQueryResultsListData;
		const [controlResults, expResults] = await getResultsById(
			queriesid,
			db
		);
		if (controlResults)
			res.status(200).json({
				status: 200,
				controlresults: controlResults,
				expresults: expResults,
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in fetching side by side results',
			});
	} catch (err) {
		console.log('error in getSideBySideQueryResultsList : ' + err);
		res.status(500).json({
			status: 500,
			message: 'error in getSideBySideQueryResultsList:' + err,
		});
	}
};

export const addNotes = async (
	addNotesData: addNotesInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { querysetid, userid, content } = addNotesData;
		const addedOn = new Date();

		const prepareNotes = new PreparedStatement({
			name: `get-${preparedStatementUniqueName}-addnote`,
			text: 'INSERT INTO notes (querysetid, userid, content, addedon) VALUES ($1, $2, $3, $4)',
			values: [querysetid, userid, content, addedOn],
		});
		const notes = await db.none(prepareNotes);
		preparedStatementUniqueName += 1;

		if (notes !== undefined)
			res.status(200).json({
				status: 200,
				message: 'Notes added successfully',
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in adding notes',
			});
	} catch (err) {
		console.log('error in addNotes : ' + err);
		res.status(500).json({
			status: 500,
			message: 'error in addNotes:' + err.message ? err.message : err,
		});
	}
};

export const getAllNotes = async (
	getAllNotesData: getAllNotesInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { querysetid, searchParam } = getAllNotesData;
		let queryString =
            'SELECT notes.content,notes.addedon,users.first_name,users.last_name \
      FROM notes \
      JOIN users on users.id=notes.userid \
      WHERE querysetid=$1 \
      ';

		if (searchParam !== null && searchParam !== undefined) {
			const likeParam = ' ILIKE \'%' + searchParam + '%\' ';
			queryString +=
                ' AND ( users.first_name ' +
                likeParam +
                ' OR users.last_name ' +
                likeParam +
                ' OR notes.content ' +
                likeParam +
                ' ) ';
		}
		queryString += ' ORDER BY addedon DESC';

		const prepareAllNotes = new PreparedStatement({
			name: `get-${preparedStatementUniqueName}-queryset-allNotes`,
			text: queryString,
			values: [querysetid],
		});
		const allNotes = await db.any(prepareAllNotes);
		preparedStatementUniqueName += 1;

		if (allNotes) res.status(200).json({ status: 200, allnotes: allNotes });
		else
			res.status(400).json({
				status: 400,
				message: 'Error in fetching notes',
			});
	} catch (err) {
		console.log('error in getAllNotes : ' + err);
		res.status(500).json({
			status: 500,
			message: 'error in getAllNotes:' + err.message ? err.message : err,
		});
	}
};

async function getResultsById(queriesID: number, db: any) {
	const controlResults = await getResultsByIdControlResult(db, queriesID);
	const expResults = await getResultsByIdExpResult(db, queriesID);
	return [controlResults, expResults];
}

function getQueriesListFilterSortingQuery(
	sortingParam: string | undefined,
	filterParam: string | undefined,
	querytags: string | undefined
) {
	let queryString = '';
	if (sortingParam !== null && sortingParam !== undefined) {
		queryString +=
            'SELECT DISTINCT queries.queriesid,sortmetricdetails.sortingMetricValueFloat,';
	} else {
		queryString += 'SELECT DISTINCT queries.queriesid,';
	}

	queryString +=
        'queries.usercityname, queries.querystring, queries.querytaskid,queries.neevalogsrequestidcontrol,queries.neevalogsrequestidexperiment, \
      queries.querycompletedat,queries.isexclude, \
      querysetdetails.metricdefinitions_primarymetric,\
      queries.totalresults, \
      querysetdetails.originalfilename as querySetName';

	if (sortingParam !== null && sortingParam !== undefined) {
		queryString +=
            ',sortmetricdetails.sortingMetricValueFloat,sortmetricdetails.sortingMetricValueBool ';
	}
	if (filterParam !== null && filterParam !== undefined) {
		queryString +=
            ',filtermetricdetails.filteringMetricValueFloat,filtermetricdetails.filteringMetricValueBool ';
	}

	queryString +=
        ' FROM querysetdetails \
JOIN queries ON queries.querysetid = querysetdetails.querysetid \
JOIN queryresults on queries.queriesid = queryresults.queriesid ';

	if (sortingParam !== null && sortingParam !== undefined) {
		queryString +=
            ' JOIN ( \
 SELECT querymetrics.queriesid, querymetrics.querymetricsname, \
 valuetable.valuefloat  as sortingMetricValueFloat, valuetable.valuebool as sortingMetricValueBool \
 FROM querymetrics \
 JOIN valuetable on querymetrics.querymetricsdefaultvalue = valuetable.valuetableid \
 WHERE querymetrics.querymetricsname = \'' +
            sortingParam +
            '\') sortmetricdetails ON sortmetricdetails.queriesid = queries.queriesid ';
	}

	if (filterParam !== null && filterParam !== undefined) {
		queryString +=
            ' JOIN ( \
 SELECT querymetrics.queriesid, querymetrics.querymetricsname, \
 valuetable.valuefloat  as filteringMetricValueFloat, valuetable.valuebool as filteringMetricValueBool \
 FROM querymetrics \
 JOIN valuetable on querymetrics.querymetricsdefaultvalue = valuetable.valuetableid \
 WHERE querymetrics.querymetricsname = \'' +
            filterParam +
            '\') filtermetricdetails ON filtermetricdetails.queriesid = queries.queriesid ';
	}

	if (querytags !== null && querytags !== undefined) {
		queryString +=
            'JOIN ( \
        SELECT queries.queriesid, querytags.querytagtype, listagg(querytags.querytagname,\', \') within group  (order by querytagname) as querytagname \
        FROM queries JOIN querytags on queries.queriesid = querytags.queriesid GROUP BY querytags.querytagtype, queries.queriesid ) querytags \
        ON querytags.queriesid = queries.queriesid ';
	}

	queryString += ' WHERE querysetdetails.querysetid=$1 ';
	return queryString;
}

async function getQueriesListPromise(
	db: any,
	queryString: string,
	filterParam: string | undefined,
	filterValueMax: number | undefined,
	filterValueMin: number | undefined,
	searchParam: string | undefined,
	querytags: string | undefined,
	querytagstype: string | undefined,
	sortingParam: string | undefined,
	sortingOrder: string | undefined,
	querysetid: number,
	pagenumber: number,
	itemsPerPage: number
) {
	if (filterParam !== null && filterParam !== undefined) {
		queryString +=
            ' AND filtermetricdetails.filteringMetricValueFloat <= \'' +
            filterValueMax +
            '\' AND filtermetricdetails.filteringMetricValueFloat >= \'' +
            filterValueMin +
            '\' ';
	}

	//for searching
	if (searchParam !== null && searchParam !== undefined) {
		const likeParam = ' ILIKE \'%' + searchParam + '%\' ';

		queryString +=
            ' AND (queries.usercityname ' +
            likeParam +
            ' OR queries.querystring ' +
            likeParam +
            ' OR queries.querytaskid ' +
            likeParam +
            ' OR querysetdetails.metricdefinitions_primarymetric ' +
            likeParam +
            ' ) ';
	}

	if (querytags) {
		queryString +=
            'AND querytagname ILIKE \'%' +
            querytags +
            '%\' AND querytags.querytagtype ILIKE \'%' +
            querytagstype +
            '%\' ';
	}

	//for sorting
	if (sortingParam !== null && sortingParam !== undefined) {
		queryString +=
            ' ORDER BY sortmetricdetails.sortingMetricValueFloat ' +
            sortingOrder;
	} else {
		queryString += ' ORDER BY queries.queriesid ASC ';
	}

	console.time('totalCount');
	const prepareTotalCount = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-totalCount`,
		text: queryString,
		values: [querysetid],
	});
	const totalCountPromise = db.any(prepareTotalCount);
	preparedStatementUniqueName += 1;
	console.timeEnd('totalCount');

	//for pagination
	queryString +=
        ' OFFSET ' + (pagenumber - 1) * itemsPerPage + ' LIMIT ' + itemsPerPage;
	return [queryString, totalCountPromise];
}

async function getQueriesList5QueriesPromise(
	db: any,
	queryString: string,
	querysetid: number,
	totalCountPromise: Promise<Array<string>>
) {
	console.time('queries');
	const prepareQueries = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-queries`,
		text: queryString,
		values: [querysetid],
	});
	const queriesPromise = db.any(prepareQueries);
	preparedStatementUniqueName += 1;
	console.timeEnd('queries');

	//For fetching sort params
	queryString =
        'SELECT DISTINCT querymetricsname \
FROM querymetrics \
WHERE queriesid IN ( \
SELECT queriesid FROM queries WHERE querysetid=$1 \
) ORDER BY querymetricsname';

	console.time('sortParams');
	const prepareSortParams = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-sortParams`,
		text: queryString,
		values: [querysetid],
	});
	const sortParamsPromise = db.any(prepareSortParams);
	preparedStatementUniqueName += 1;
	console.timeEnd('sortParams');

	console.time('queryCount');
	const prepareQueryCount = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-queryCount`,
		text: 'SELECT COUNT(queriesid) FROM queries WHERE querysetid=$1',
		values: [querysetid],
	});
	const queryCountPromise = db.any(prepareQueryCount);
	preparedStatementUniqueName += 1;
	console.timeEnd('queryCount');

	queryString =
        'SELECT DISTINCT querytagtype, querytagname \
    FROM querytags \
    WHERE queriesid IN ( \
    SELECT queriesid FROM queries WHERE querysetid=$1 \
    ) ORDER BY querytagtype';
	const prepareFilterParams = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-filterParams`,
		text: queryString,
		values: [querysetid],
	});
	const filterParamsPromise = db.any(prepareFilterParams);
	preparedStatementUniqueName += 1;

	console.time('promise.all for 5 query');
	const [totalCountVariable, queries, sortParams, queryCount, filterParams] =
        await Promise.all([
        	totalCountPromise,
        	queriesPromise,
        	sortParamsPromise,
        	queryCountPromise,
        	filterParamsPromise,
        ]);
	console.timeEnd('promise.all for 5 query');
	const totalCount = totalCountVariable.length;
	return [totalCount, queries, sortParams, queryCount, filterParams];
}

async function getQueriesListFilteredData(
	db: any,
	sortParams: Array<String>,
	page: number | undefined,
	queries: Array<string>,
	queryCount: Array<{ count: number }> | number,
	itemsPerPage: number,
	filterParams: Array<string>
) {
	const duplicateParams = {};
	const filteredSortParams: Array<{}> = [];
	sortParams.map((eachParam: any) => {
		const trimedParam = eachParam.querymetricsname?.trim();
		if (!(trimedParam in duplicateParams)) {
			duplicateParams[trimedParam] = true;
			filteredSortParams.push({ querymetricsname: trimedParam });
		}
	});

	// For fetching queryratings for each query
	if (page !== null && page !== undefined) {
		await Promise.all(
			queries.map(async (eachQuery: any) => {
				const prepareRatingDetails = new PreparedStatement({
					name: `get-${preparedStatementUniqueName}-ratingDetails`,
					text: 'SELECT queryratings.queryratingname,queryratings.overridevalue, \
            queryratings.ratingscale,queryratings.ratingtype, \
            valuetable.valuefloat,valuetable.valuestring,valuetable.valuebool \
            FROM queryratings \
         JOIN valuetable ON valuetable.valuetableid = queryratings.overridevalue \
         WHERE queryratings.queriesid=$1 ORDER BY queryratings.queryratingname',
					values: [eachQuery.queriesid],
				});
				eachQuery['ratingdetails'] = await db.any(prepareRatingDetails);
				preparedStatementUniqueName += 1;
			})
		);
	}

	if (page !== null && page !== undefined) {
		await Promise.all(
			queries.map(async (eachQuery: any) => {
				const prepareSideBySideRating = new PreparedStatement({
					name: `get-${preparedStatementUniqueName}-sidebysiderating`,
					text: 'SELECT sidebysideratingsid,queriesid,ratingtext from sidebysideratings WHERE queriesid=$1',
					values: [eachQuery.queriesid],
				});
				eachQuery['sidebysiderating'] = await db.any(
					prepareSideBySideRating
				);
				preparedStatementUniqueName += 1;
			})
		);
	}

	const totalQueries = queryCount[0].count;
	queryCount = Math.ceil(Number(totalQueries) / itemsPerPage);

	const queryTagParams = {};
	filterParams.map((eachVal: any) => {
		const key = eachVal.querytagtype;
		const value = eachVal.querytagname;
		if (!(key in queryTagParams)) {
			queryTagParams[key] = [];
		}
		queryTagParams[key].push(value);
	});
	return [filteredSortParams, queryTagParams];
}

async function getQueriesListQueries(
	db: any,
	queries: Array<{ queriesid: number }>,
	fromSideBySide: boolean,
	controlResults: Array<string>,
	expResults: Array<string>
) {
	const firstQueriesId = queries[0].queriesid;
	if (fromSideBySide) {
		const [controlResultsData, expResultsData] = await getResultsById(
			firstQueriesId,
			db
		);
		controlResults.push(...controlResultsData);
		expResults.push(...expResultsData);
	}
	let queryString =
        'SELECT queries.queriesid, \
querymetrics.querymetricsname, \
querymetrics.invaliddata, \
querymetrics.querymetricsdefaultparam, querymetrics.querymetricsdefaultparamvalue,\
querymetrics.querymetricscontrolparam, querymetrics.querymetricscontrolparamvalue,\
querymetrics.querymetricsexperimentparam, querymetrics.querymetricsexperimentparamvalue,\
defaultmetricvalue.valuebool as defvaluebool, defaultmetricvalue.valuestring as defvaluestring, defaultmetricvalue.valuefloat as defvaluefloat,\
controlmetricvalue.valuebool as controlvaluebool, controlmetricvalue.valuestring as controlvaluestring, controlmetricvalue.valuefloat as controlvaluefloat,\
experimentmetricvalue.valuebool as expvaluebool, experimentmetricvalue.valuestring as expvaluestring, experimentmetricvalue.valuefloat as expvaluefloat \
from queries \
JOIN querymetrics on querymetrics.queriesid = queries.queriesid \
LEFT JOIN valuetable as defaultmetricvalue on querymetrics.querymetricsdefaultvalue = defaultmetricvalue.valuetableid \
LEFT JOIN valuetable as controlmetricvalue on querymetrics.querymetricscontrolvalue = controlmetricvalue.valuetableid \
LEFT JOIN valuetable as experimentmetricvalue on querymetrics.querymetricsexperimentvalue = experimentmetricvalue.valuetableid \
WHERE ';

	let whereClause = '';
	queries.map((eachQuery) => {
		whereClause += ' OR queries.queriesid = ' + eachQuery.queriesid;
	});
	whereClause = whereClause ? whereClause.substring(4) : '';
	queryString = queryString.concat(whereClause);
	queryString += ' ORDER BY querymetrics.querymetricsname';

	const prepareQueryMetrics = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-QueryMetrics`,
		text: queryString,
	});
	const queryMetricsPromise = db.any(prepareQueryMetrics);
	preparedStatementUniqueName += 1;

	queryString =
        'SELECT queriesid, querytagtype, listagg(querytagname, \', \') within group(order by querytagname) as querytagname  FROM querytags WHERE ';
	whereClause = whereClause.replace(/queries.queriesid/g, 'queriesid');
	queryString = queryString.concat(whereClause);
	queryString += ' GROUP BY querytagtype, queriesid';
	const prepareQueryTags = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-queryTags`,
		text: queryString,
	});
	const queryTagsPromise = db.any(prepareQueryTags);
	preparedStatementUniqueName += 1;

	const [queryMetrics, queryTags] = await Promise.all([
		queryMetricsPromise,
		queryTagsPromise,
	]);

	queries.map((eachQuery: any) => {
		eachQuery['querymetrics'] = [];
		eachQuery['querytags'] = [];

		queryTags.map((eachTag: any) => {
			if (eachQuery.queriesid === eachTag.queriesid) {
				eachQuery['querytags'].push(eachTag);
			}
		});

		queryMetrics.map((eachMetric: any) => {
			if (eachQuery.queriesid === eachMetric.queriesid) {
				eachQuery['querymetrics'].push(eachMetric);
			}
		});
	});
}

function getQuerysetsListFilterSortingQuery(
	sortingParam: string | undefined,
	filterParam: string | undefined
) {
	let queryString = '';
	if (sortingParam !== null && sortingParam !== undefined) {
		queryString +=
            'SELECT DISTINCT querysetdetails.querysetid,sortmetricdetails.sortingMetricValueFloat,';
	} else {
		queryString += 'SELECT DISTINCT querysetdetails.querysetid,';
	}

	queryString +=
        ' querysetdetails.imports3path,querysetdetails.querysetdescription,querysetdetails.batch,querysetdetails.importedon,querysetdetails.originalfilename,querysetdetails.metricdefinitions_primarymetric, \
      querysetdetails.batchcompletedat,querysetdetails.batchcreatedat, \
    querycount.totalqueries, \
    querysetmetrics.querysetmetricsdefaultvalue, \
      defMetricVal.valueFloat as metricValueFloat, defMetricVal.valuebool as metricValueBool, defMetricVal.valuestring as metricValueString, \
      users.first_name as importedbyfirstname, users.last_name as importedbylastname';

	if (sortingParam !== null && sortingParam !== undefined) {
		queryString +=
            ',sortmetricdetails.sortingMetricValueFloat,sortmetricdetails.sortingMetricValueBool ';
	}
	if (filterParam !== null && filterParam !== undefined) {
		queryString +=
            ',filtermetricdetails.filteringMetricValueFloat,filtermetricdetails.filteringMetricValueBool ';
	}

	queryString +=
        ' FROM querysetdetails \
JOIN queries ON queries.querysetid = querysetdetails.querysetid \
LEFT JOIN users ON querysetdetails.importedby = users.id \
LEFT JOIN querysetmetrics on (queries.querysetid =  querysetmetrics.querysetid \
  AND querysetdetails.metricdefinitions_primarymetric = querysetmetrics.querysetmetricsname) \
 LEFT JOIN valuetable as defMetricVal on defMetricVal.valuetableid = querysetmetrics.querysetmetricsdefaultvalue ';

	if (sortingParam !== null && sortingParam !== undefined) {
		queryString +=
            ' JOIN ( \
SELECT querysetmetrics.querysetid, querysetmetrics.querysetmetricsname, \
valuetable.valuefloat  as sortingMetricValueFloat, valuetable.valuebool as sortingMetricValueBool \
FROM querysetmetrics \
JOIN valuetable on querysetmetrics.querysetmetricsdefaultvalue = valuetable.valuetableid \
WHERE querysetmetrics.querysetmetricsname = \'' +
            sortingParam +
            '\') sortmetricdetails ON sortmetricdetails.querysetid = querysetdetails.querysetid ';
	}

	if (filterParam !== null && filterParam !== undefined) {
		queryString +=
            ' JOIN ( \
SELECT querysetmetrics.querysetid, querysetmetrics.querysetmetricsname, \
valuetable.valuefloat  as filteringMetricValueFloat, valuetable.valuebool as filteringMetricValueBool \
FROM querysetmetrics \
JOIN valuetable on querysetmetrics.querysetmetricsdefaultvalue = valuetable.valuetableid \
WHERE querysetmetrics.querysetmetricsname = \'' +
            filterParam +
            '\') filtermetricdetails ON filtermetricdetails.querysetid =  querysetdetails.querysetid ';
	}

	queryString +=
        ' JOIN ( \
SELECT queries.querysetid, COUNT(*) totalqueries FROM queries \
GROUP BY queries.querysetid ORDER BY queries.querysetid \
) querycount ON querycount.querysetid = queries.querysetid \
WHERE querysetdetails.querysettype=$1 AND querysetdetails.is_active=true ';
	return queryString;
}

async function getQuerysets4QueriesPromise(
	db: any,
	queryString: string,
	filterParam: string | undefined,
	searchParam: string | undefined,
	filterValueMax: number | undefined,
	filterValueMin: number | undefined,
	sortingParam: string | undefined,
	sortingOrder: string | undefined,
	querysettype: string,
	pagenumber: number,
	itemsPerPage: number
) {
	if (filterParam !== null && filterParam !== undefined) {
		queryString +=
            ' AND filtermetricdetails.filteringMetricValueFloat <= \'' +
            filterValueMax +
            '\' AND filtermetricdetails.filteringMetricValueFloat >= \'' +
            filterValueMin +
            '\' ';
	}

	//for searching
	if (searchParam !== null && searchParam !== undefined) {
		const likeParam = ' ILIKE \'%' + searchParam + '%\' ';
		queryString +=
            ' AND (querysetdetails.batch ' +
            likeParam +
            ' OR querysetdetails.metricdefinitions_primarymetric ' +
            likeParam +
            ' OR querysetdetails.originalfilename ' +
            likeParam +
            ' ) ';
	}

	//for sorting
	if (sortingParam !== null && sortingParam !== undefined) {
		queryString +=
            ' ORDER BY sortmetricdetails.sortingMetricValueFloat ' +
            sortingOrder;
	} else {
		queryString += ' ORDER BY querysetdetails.importedon DESC ';
	}

	console.time('totalCount');
	const prepareTotalCount = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-queryset-totalCount`,
		text: queryString,
		values: [querysettype],
	});
	const totalCountPromise = db.any(prepareTotalCount);
	preparedStatementUniqueName += 1;
	console.timeEnd('totalCount');

	queryString +=
        ' OFFSET ' + (pagenumber - 1) * itemsPerPage + ' LIMIT ' + itemsPerPage;

	return [queryString, totalCountPromise];
}

async function getQuerysetsList4QueriesPromise(
	db: any,
	queryString: string,
	querysettype: string,
	itemsPerPage: number,
	totalCountPromise: Promise<Array<string>>
) {
	console.time('querysets');
	const prepareQuerysets = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-querysets`,
		text: queryString,
		values: [querysettype],
	});
	const querysetsPromise = db.any(prepareQuerysets);
	preparedStatementUniqueName += 1;
	console.timeEnd('querysets');

	console.time('querysetCount');
	const prepareQuerySetCount = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-querySetCount`,
		text: 'SELECT count(querysetid) FROM querysetdetails WHERE querysettype=$1',
		values: [querysettype],
	});
	const querySetCountPromise = db.any(prepareQuerySetCount);
	preparedStatementUniqueName += 1;
	console.timeEnd('querysetCount');

	console.time('sortParams');
	const prepareSortParams = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-queryset-sortParams`,
		text: 'SELECT DISTINCT querysetmetricsname FROM querysetmetrics ORDER BY querysetmetricsname',
	});
	const sortParamsPromise = db.any(prepareSortParams);
	preparedStatementUniqueName += 1;
	console.timeEnd('sortParams');

	console.time('promise.all for 4 queries');
	const [totalCountVariable, querySets, querySetCountVariable, sortParams] =
        await Promise.all([
        	totalCountPromise,
        	querysetsPromise,
        	querySetCountPromise,
        	sortParamsPromise,
        ]);
	const totalCount = totalCountVariable.length;
	let querySetCount = querySetCountVariable;
	console.timeEnd('promise.all for 4 queries');

	const duplicateParams = {};
	const filteredSortParams: Array<{}> = [];
	sortParams.map((eachParam: any) => {
		const trimedParam = eachParam.querysetmetricsname?.trim();
		if (!(trimedParam in duplicateParams)) {
			duplicateParams[trimedParam] = true;
			filteredSortParams.push({ querysetmetricsname: trimedParam });
		}
	});

	querySetCount = Math.ceil(parseInt(querySetCount[0].count) / itemsPerPage);

	return [totalCount, querySets, querySetCount, filteredSortParams];
}

async function getQuerysetsList2QueriesPromise(
	db: any,
	querySets: Array<string>,
	querysettype: string
) {
	let queryString =
        'SELECT querysetdetails.querysetid, \
querysetmetrics.querysetmetricsname, \
querysetmetrics.invaliddata,querysetmetrics.metricupdateprocessing, \
querysetmetrics.querysetmetricsdefaultparam, querysetmetrics.querysetmetricsdefaultparamvalue, \
querysetmetrics.querysetmetricscontrolparam, querysetmetrics.querysetmetricscontrolparamvalue, \
querysetmetrics.querysetmetricsexperimentparam, querysetmetrics.querysetmetricsexperimentparamvalue, \
defaultmetricvalue.valuebool as defvaluebool, defaultmetricvalue.valuestring as defvaluestring, defaultmetricvalue.valuefloat as defvaluefloat, \
controlmetricvalue.valuebool as controlvaluebool, controlmetricvalue.valuestring as controlvaluestring, controlmetricvalue.valuefloat as controlvaluefloat, \
experimentmetricvalue.valuebool as expvaluebool, experimentmetricvalue.valuestring as expvaluestring, experimentmetricvalue.valuefloat as expvaluefloat \
from querysetdetails \
JOIN querysetmetrics on querysetmetrics.querysetid = querysetdetails.querysetid \
LEFT JOIN valuetable as defaultmetricvalue on querysetmetrics.querysetmetricsdefaultvalue = defaultmetricvalue.valuetableid \
LEFT JOIN valuetable as controlmetricvalue on querysetmetrics.querysetmetricscontrolvalue = controlmetricvalue.valuetableid \
LEFT JOIN valuetable as experimentmetricvalue on querysetmetrics.querysetmetricsexperimentvalue = experimentmetricvalue.valuetableid \
WHERE querysetdetails.querysettype=$1 AND querysetdetails.is_active=true \
AND (';
	let whereClause = '';
	querySets.map((eachQuery: any) => {
		whereClause +=
            ' OR querysetdetails.querysetid = ' + eachQuery.querysetid;
	});

	whereClause = whereClause.substring(4);
	queryString = queryString.concat(whereClause);
	queryString += ') ';
	queryString += ' ORDER BY querysetmetrics.querysetmetricsname';

	console.time('querymetrics');
	const prepareQueryMetrics = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-queryset-queryMetrics`,
		text: queryString,
		values: [querysettype],
	});
	const querymetricsPromise = db.any(prepareQueryMetrics);
	preparedStatementUniqueName += 1;
	console.timeEnd('querymetrics');

	//add query set tags
	queryString =
        'SELECT querysetid, listagg(querysettagname,\', \') within group \
    (order by querysettagname) as querysettagname \
    FROM querysettags \
    WHERE ';
	whereClause = whereClause.replace(/querysetdetails/g, 'querysettags');
	queryString = queryString.concat(whereClause);
	queryString += ' GROUP BY querysetid ';
	// console.log(queryString);
	const prepareQuerySetTags = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-queryset-querysettags`,
		text: queryString,
	});
	const querytagsPromise = db.any(prepareQuerySetTags);
	preparedStatementUniqueName += 1;
	console.time('querytags');

	console.time('promise.all for 2 queries');
	const [queryMetrics, queryTags] = await Promise.all([
		querymetricsPromise,
		querytagsPromise,
	]);
	console.timeEnd('promise.all for 2 queries');
	return [queryMetrics, queryTags];
}

function getQuerysetsListMapQuerySets(
	querySets: Array<string>,
	queryMetrics: Array<string>,
	queryTags: Array<string>
) {
	querySets.map((eachQuery: any) => {
		const filteredResultMovementData = {};
		eachQuery['querysetmetrics'] = [];
		queryMetrics.map((eachMetric: any) => {
			if (eachQuery.querysetid === eachMetric.querysetid) {
				const eachValArr = eachMetric.querysetmetricsname?.split(':');
				if (
					eachValArr?.length >= 2 &&
                    (eachValArr[0] === 'result_movement' ||
                        eachValArr[1] === 'result_movement')
				) {
					const value = eachMetric.defvaluefloat;
					const name = eachValArr.pop();
					const keyName =
                        eachValArr[0] === 'result_movement'
                        	? 'movement'
                        	: 'score';
					const otherName =
                        eachValArr[0] === 'result_movement'
                        	? 'score'
                        	: 'movement';
					if (
						name in filteredResultMovementData &&
                        filteredResultMovementData[name] !== undefined
					) {
						if (
							filteredResultMovementData[name][keyName] === null
						) {
							filteredResultMovementData[name][keyName] = value;
						} else {
							filteredResultMovementData[name][otherName] = value;
						}
					} else {
						filteredResultMovementData[name] = {};
						filteredResultMovementData[name][keyName] = value;
						filteredResultMovementData[name][otherName] = null;
					}
				} else {
					eachQuery['querysetmetrics'].push(eachMetric);
				}
			}
		});

		eachQuery['querysettags'] = [];
		queryTags.map((eachQueryTag: any) => {
			if (eachQuery.querysetid === eachQueryTag.querysetid) {
				eachQuery['querysettags'].push(eachQueryTag.querysettagname);
			}
		});

		eachQuery['filteredResultMovementData'] = Object.keys(
			filteredResultMovementData
		).map((eachVal) => ({
			[eachVal]: filteredResultMovementData[eachVal],
		}));
	});
}

async function getQueryresultsListQueries(
	db: any,
	searchParam: string | undefined,
	queriesid: number,
	pagenumber: number,
	itemsPerPage: number
) {
	let queryString =
        'SELECT queryresults.queriesid,queryresults.actionurl,queryresults.resultid,queryresults.queryresultsid,queryresults.scalerank,\
      queryresults.segments,queryresults.snippet,queryresults.title,queryresults.typename, queryresults.universaltype, \
      resultsidemetadata.sidemetadatarank, resultsidemetadata.excludefrommainmetrics, resultsidemetadata.koalascore, resultsidemetadata.koalashard \
      FROM queryresults \
      LEFT JOIN resultsidemetadata on queryresults.queryresultsid=resultsidemetadata.queryresultsid \
      WHERE queriesid=$1 \
    ';

	if (searchParam !== null && searchParam !== undefined) {
		const likeParam = ' ILIKE \'%' + searchParam + '%\' ';
		queryString +=
            ' AND (queryresults.actionurl ' +
            likeParam +
            ' OR queryresults.resultid ' +
            likeParam +
            ' OR queryresults.typename ' +
            likeParam +
            ' OR queryresults.universaltype ' +
            likeParam +
            ' ) ';
	}

	queryString += ' ORDER BY resultsidemetadata.sidemetadatarank ASC ';

	console.time('resultCount');
	const prepareResultCount = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-queryResultsCount`,
		text: `${queryString}`,
		values: [queriesid],
	});
	const resultCountPromise = db.many(prepareResultCount);
	preparedStatementUniqueName += 1;
	console.timeEnd('resultCount');

	queryString +=
        ' OFFSET ' + (pagenumber - 1) * itemsPerPage + ' LIMIT ' + itemsPerPage;

	console.time('queryResults');
	const prepareQueryResults = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-queryResults`,
		text: `${queryString}`,
		values: [queriesid],
	});
	const queryResultsPromise = db.many(prepareQueryResults);
	preparedStatementUniqueName += 1;
	console.timeEnd('queryResults');

	console.time('queryDetails');
	const prepareQueryDetails = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-queryDetails`,
		text: 'SELECT querystring,querytaskid,usercityname from queries WHERE queriesid = $1',
		values: [queriesid],
	});
	const queryDetailsPromise = db.many(prepareQueryDetails);
	preparedStatementUniqueName += 1;
	console.timeEnd('queryDetails');

	console.time('promise.all for 3 queries');
	const [resultCount, queryResults, queryDetails] = await Promise.all([
		resultCountPromise,
		queryResultsPromise,
		queryDetailsPromise,
	]);
	console.timeEnd('promise.all for 3 queries');

	return [resultCount, queryResults, queryDetails];
}

async function getQueryresultsListSideBySideQueryResults(
	db: any,
	searchParam: string,
	queriesid: number,
	itemsPerPage: number,
	pagenumber: number
) {
	let queryString =
        'SELECT queryresults.queriesid,queryresults.actionurl,queryresults.resultid,queryresults.scalerank,\
      queryresults.segments,queryresults.snippet,queryresults.title,queryresults.typename, queryresults.universaltype, \
      resultsidemetadata.sidemetadatarank, resultsidemetadata.excludefrommainmetrics, resultsidemetadata.koalascore, resultsidemetadata.koalashard \
      FROM queryresults \
      LEFT JOIN resultsidemetadata on queryresults.queryresultsid=resultsidemetadata.queryresultsid \
      WHERE queriesid=$1 \
    ORDER BY resultsidemetadata.sidemetadatarank ASC ';

	if (searchParam !== null && searchParam !== undefined) {
		const likeParam = ' ILIKE \'%' + searchParam + '%\' ';
		queryString +=
            ' AND (queryresults.actionurl ' +
            likeParam +
            ' OR queryresults.resultid ' +
            likeParam +
            ' OR queryresults.typename ' +
            likeParam +
            ' OR queryresults.universaltype ' +
            likeParam +
            ' ) ';
	}

	const prepareResultCount = new PreparedStatement({
		name: `getQuepreparedStatementUniqueNameryResultsListSideBySide-${preparedStatementUniqueName}-prepareResultCount`,
		text: queryString,
		values: [queriesid],
	});
	let resultCount = await db.any(prepareResultCount);
	preparedStatementUniqueName += 1;
	resultCount = Math.ceil(parseInt(resultCount.length) / itemsPerPage);

	queryString +=
        ' OFFSET ' + (pagenumber - 1) * itemsPerPage + ' LIMIT ' + itemsPerPage;

	const prepareQueryResults = new PreparedStatement({
		name: `getQueryResultsListSideBySide-${preparedStatementUniqueName}-prepareQueryResults`,
		text: queryString,
		values: [queriesid],
	});
	const queryResults = await db.any(prepareQueryResults);
	preparedStatementUniqueName += 1;
	return [resultCount, queryResults];
}

async function getSideBySideResultsControlResult(
	db: any,
	queryresultsidcontrol: number
) {
	const prepareControlResults = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-queryset-ControleResult`,
		text: 'SELECT actionurl,resultid,scalerank,segments,snippet,title,typename,universaltype, \
      sidemetadatatype, sidemetadatadocsignals, sidemetadatarank, resultsidemetadata.excludefrommainmetrics, resultsidemetadata.koalascore, resultsidemetadata.koalashard \
         FROM queryresults \
         LEFT JOIN resultsidemetadata \
         ON resultsidemetadata.queryresultsid = queryresults.queryresultsid \
         WHERE sidemetadatatype = \'Control\' AND queryresults.queryresultsid = $1 \
         ORDER BY title',
		values: [queryresultsidcontrol],
	});
	const controlResults = await db.many(prepareControlResults);
	preparedStatementUniqueName += 1;

	const queryString =
        'SELECT  resultratingsid, queryresultsid, resultratingname, ratingscale, ratingtype, \
valuebool as overridevaluebool, valuestring as overridevaluestring, valuefloat as overridevaluefloat \
FROM resultratings \
JOIN valuetable on valuetable.valuetableid = resultratings.overridevalue \
WHERE queryresultsid = $1 ORDER BY resultratingname';

	const prepareResultsMetricsControl = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-queryset-ResultMetricsControl`,
		text: queryString,
		values: [queryresultsidcontrol],
	});
	const resultMetricsControl = await db.many(prepareResultsMetricsControl);
	preparedStatementUniqueName += 1;

	return [controlResults, resultMetricsControl];
}

async function getSideBySideResultsExpResult(
	db: any,
	queryresultsidexp: number
) {
	const prepareExpResults = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-queryset-ExperimentResult`,
		text: 'SELECT actionurl,resultid,scalerank,segments,snippet,title,typename,universaltype, \
      sidemetadatatype, sidemetadatadocsignals, sidemetadatarank, resultsidemetadata.excludefrommainmetrics, resultsidemetadata.koalascore, resultsidemetadata.koalashard \
         FROM queryresults \
         LEFT JOIN resultsidemetadata \
         ON resultsidemetadata.queryresultsid = queryresults.queryresultsid \
         WHERE sidemetadatatype = \'Experiment\' AND queryresults.queryresultsid = $1 \
         ORDER BY title',
		values: [queryresultsidexp],
	});
	const expResults = await db.many(prepareExpResults);
	preparedStatementUniqueName += 1;

	const queryString =
        'SELECT  resultratingsid, queryresultsid, resultratingname, ratingscale, ratingtype, \
valuebool as overridevaluebool, valuestring as overridevaluestring, valuefloat as overridevaluefloat \
FROM resultratings \
JOIN valuetable on valuetable.valuetableid = resultratings.overridevalue \
WHERE queryresultsid = $1 ORDER BY resultratingname';

	const prepareResultsMetricsExperiment = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-queryset-ResultMetricsExperiment`,
		text: queryString,
		values: [queryresultsidexp],
	});
	const resultMetricsExperiment = await db.many(
		prepareResultsMetricsExperiment
	);
	preparedStatementUniqueName += 1;

	return [expResults, resultMetricsExperiment];
}

async function getResultsByIdControlResult(db: any, queriesID: number) {
	let queryString =
        'SELECT actionurl,resultid,scalerank,segments,snippet,typename,universaltype, \
      queryresults.queryresultsid,resultsidemetadata.sidemetadatarank, resultsidemetadata.sidemetadatatitle as title, resultsidemetadata.excludefrommainmetrics, resultsidemetadata.koalascore, resultsidemetadata.koalashard  \
         FROM queryresults \
         LEFT JOIN resultsidemetadata on queryresults.queryresultsid=resultsidemetadata.queryresultsid \
         AND resultsidemetadata.sidemetadatatype = \'Control\' \
         WHERE queryresults.queriesid=$1 \
         ORDER BY resultsidemetadata.sidemetadatarank ASC ';
	const prepareControlResults = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-ControlResults`,
		text: queryString,
		values: [queriesID],
	});
	const controlResults = await db.any(prepareControlResults);
	preparedStatementUniqueName += 1;

	let whereClause = '';
	let resultMetrics: Array<string>;
	if (controlResults.length > 0) {
		queryString =
            'SELECT  resultratingsid, queryresultsid, resultratingname, ratingscale, ratingtype, \
valuebool as overridevaluebool, valuestring as overridevaluestring, valuefloat as overridevaluefloat \
FROM resultratings \
JOIN valuetable on valuetable.valuetableid = resultratings.overridevalue \
WHERE ';

		controlResults.map((eachRes: any) => {
			whereClause += ' or queryresultsid = ' + eachRes.queryresultsid;
		});
		whereClause = whereClause.substring(4);
		queryString = queryString.concat(whereClause);
		queryString += ' ORDER BY resultratingname';

		const prepareControlResultsMetrics = new PreparedStatement({
			name: `get-${preparedStatementUniqueName}-ControlResultsMetrics`,
			text: queryString,
		});
		resultMetrics = await db.any(prepareControlResultsMetrics);
		preparedStatementUniqueName += 1;

		controlResults.map((eachRes: any) => {
			eachRes['resultmetric'] = [];
			resultMetrics.map((eachMetric: any) => {
				if (eachRes.queryresultsid === eachMetric.queryresultsid) {
					eachRes['resultmetric'].push(eachMetric);
				}
			});
		});
	}
	return controlResults;
}

async function getResultsByIdExpResult(db: any, queriesID: number) {
	let queryString =
        'SELECT actionurl,resultid,scalerank,segments,snippet,typename,universaltype, \
      queryresults.queryresultsid,resultsidemetadata.sidemetadatarank, resultsidemetadata.sidemetadatatitle as title, resultsidemetadata.excludefrommainmetrics, resultsidemetadata.koalascore, resultsidemetadata.koalashard \
         FROM queryresults \
         LEFT JOIN resultsidemetadata on queryresults.queryresultsid=resultsidemetadata.queryresultsid \
         AND resultsidemetadata.sidemetadatatype = \'Experiment\' \
         WHERE queryresults.queriesid=$1 \
         ORDER BY resultsidemetadata.sidemetadatarank ASC ';
	const prepareExperimentResults = new PreparedStatement({
		name: `get-${preparedStatementUniqueName}-ExperimentResults`,
		text: queryString,
		values: [queriesID],
	});
	const expResults = await db.any(prepareExperimentResults);
	preparedStatementUniqueName += 1;
	if (expResults.length > 0) {
		queryString =
            'SELECT  resultratingsid, queryresultsid, resultratingname, ratingscale, ratingtype, \
valuebool as overridevaluebool, valuestring as overridevaluestring, valuefloat as overridevaluefloat \
FROM resultratings \
JOIN valuetable on valuetable.valuetableid = resultratings.overridevalue \
WHERE ';

		let whereClause = '';
		expResults.map((eachRes: any) => {
			whereClause += ' or queryresultsid = ' + eachRes.queryresultsid;
		});
		whereClause = whereClause.substring(4);
		queryString = queryString.concat(whereClause);
		queryString += ' ORDER BY resultratingname';

		const prepareExperimentResultsMetrics = new PreparedStatement({
			name: `get-${preparedStatementUniqueName}-ExperimentResultsMetrics`,
			text: queryString,
		});
		const resultMetrics = await db.any(prepareExperimentResultsMetrics);
		preparedStatementUniqueName += 1;

		expResults.map((eachRes: any) => {
			eachRes['resultmetric'] = [];
			resultMetrics.map((eachMetric: any) => {
				if (eachRes.queryresultsid === eachMetric.queryresultsid) {
					eachRes['resultmetric'].push(eachMetric);
				}
			});
		});
	}
	return expResults;
}
