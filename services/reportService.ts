import { PreparedStatement } from 'pg-promise';
import { getConnection } from '../db';
import { Report } from '../models/DBModels/index';
const moment = require('moment');
import {
	getQuerysetTagsInterface,
	getQuerysetsByTagsInterface,
	generateReportInterface,
	saveReportInterface,
	getReportInterface,
	getSavedReportsInterface,
	deleteReportInterface,
	compareQuerysetsInterface,
} from '../models/interface/reportInterface';
import { commonReqResInterface } from '../models/interface/commonReqResInterface';
let totalResultLength = 0;

const generateReportFunc = async (
	metrics: Array<{}>,
	tagName: string,
	startDate: string,
	endDate: string
) => {
	const db = await getConnection();
	try {
		const metricsList = metrics;

		const results: Array<{}> = [];
		const series: Array<{}> = [];
		await Promise.all(
			metricsList.map(async (eachMetric) => {
				let params = [tagName, eachMetric];
				let queryString =
                    'SELECT DISTINCT (querysetdetails.querysetid),querysetdetails.originalfilename,\
       querysetdetails.batchcompletedat,querysettags.querysettagname,querysetmetrics.querysetmetricsname,valuetable.valuefloat\
       FROM querysetdetails\
       JOIN querysetmetrics\
       ON querysetmetrics.querysetid=querysetdetails.querysetid\
       JOIN querysettags ON querysettags.querysetid = querysetdetails.querysetid\
       JOIN valuetable ON valuetable.valuetableid = querysetmetrics.querysetmetricsdefaultvalue\
       WHERE querysettags.querysettagname = $1 AND querysetmetrics.querysetmetricsname=$2';

				if (
					startDate !== undefined &&
                    endDate !== undefined &&
                    startDate !== null &&
                    endDate !== null
				) {
					queryString +=
                        ' AND batchcompletedat >= $3 AND batchcompletedat<= $4 ';
					params = [tagName, eachMetric, startDate, endDate];
				}

				const prepareEachRes = new PreparedStatement({
					name: 'report-eachRes',
					text: queryString,
					values: params,
				});
				const eachRes = await db.any(prepareEachRes);

				const data: Array<Object> = [];
				eachRes.map(
					(obj: {
                        querysetid: number;
                        originalfilename: string;
                        valuefloat: number;
                    }) => {
						const found = results.some(
							(el: { querysetid: number }) =>
								el.querysetid === obj.querysetid
						);
						if (!found) results.push(obj);
						data.push({
							x: obj.originalfilename,
							y: obj.valuefloat,
						});
					}
				);
				const seriesObj = {
					name: eachMetric,
					data: data,
				};

				series.push(seriesObj);
			})
		);

		if (results) return [series, results];
	} catch (err) {
		console.log('error in generateReportFunc : ' + err);
		return err.message ? err.message : err;
	}
};
export const getTags = async (
	getTagsData: getQuerysetTagsInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { itemsPerPage, pagenumber } = getTagsData;
		let queryString =
            'SELECT querysettagname, COUNT(*) totalquerysets \
           FROM querysettags \
           GROUP BY querysettagname \
           ORDER BY querysettagname ';
		const prepareEachRes = new PreparedStatement({
			name: 'report-totalCount',
			text: queryString,
		});
		let totalCount = await db.many(prepareEachRes);
		totalCount = totalCount.length;

		queryString +=
            ' OFFSET ' +
            (pagenumber - 1) * itemsPerPage +
            ' LIMIT ' +
            itemsPerPage;

		const prepareResult = new PreparedStatement({
			name: 'report-select querysettagname',
			text: queryString,
		});
		const results = await db.many(prepareResult);

		if (results)
			res.status(200).json({
				status: 200,
				querysettags: results,
				totalcount: totalCount,
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in fetching querysettags',
			});
	} catch (err) {
		console.log('error in getTags : ' + err);
		res.status(500).json({
			status: 500,
			message: 'error in getTags :' + err.message ? err.message : err,
		});
	}
};

export const getQuerysetsListByTags = async (
	getQuerysetsByTagsParams: getQuerysetsByTagsInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { querysettagname } = getQuerysetsByTagsParams;
		const prepareEachRes = new PreparedStatement({
			name: 'report-getQuerySetsListByTags',
			text: 'SELECT DISTINCT(querysetdetails.querysetid), querysettags.querysettagname, \
      querysetdetails.batch, querysetdetails.batchcompletedat \
           FROM querysettags \
           LEFT JOIN  querysetdetails ON querysettags.querysetid = querysetdetails.querysetid \
           WHERE querysettags.querysettagname = $1',
			values: [querysettagname],
		});
		const results = await db.many(prepareEachRes);

		const metrics = {};

		await Promise.all(
			results.map(async (eachRes: { querysetid: number }) => {
				const prepareEachRes = new PreparedStatement({
					name: 'report-QuerySetMetrics',
					text: 'SELECT querysetmetricsname FROM querysetmetrics WHERE querysetid=$1',
					values: [eachRes.querysetid],
				});
				const querysetMetrics = await db.any(prepareEachRes);

				querysetMetrics.map(
					(eachMetrics: { querysetmetricsname: string }) => {
						if (eachMetrics.querysetmetricsname in metrics) {
							metrics[eachMetrics.querysetmetricsname] += 1;
						} else metrics[eachMetrics.querysetmetricsname] = 1;
					}
				);
			})
		);

		const allMetrics: Array<{}> = [];
		Object.keys(metrics).map((eachMetric) => {
			if (metrics[eachMetric] >= results.length)
				allMetrics.push({ metricname: eachMetric, type: 'common' });
			else allMetrics.push({ metricname: eachMetric, type: 'uncommon' });
		});

		if (results)
			res.status(200).json({
				status: 200,
				querysets: results,
				metrics: allMetrics,
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in fetching querysets list',
			});
	} catch (err) {
		console.log('error in getQuerysetsListByTags : ' + err);
		res.status(500).json({
			status: 500,
			message:
                'error in getQuerysetsListByTags :' + err.message
                	? err.message
                	: err,
		});
	}
};

export const generateReport = async (
	generateReportParams: generateReportInterface,
	res: commonReqResInterface
) => {
	try {
		const { metrics, querysettagname, startdate, enddate } =
            generateReportParams;
		const results = await generateReportFunc(
			metrics,
			querysettagname,
			startdate,
			enddate
		);
		if (results)
			res.status(200).json({
				status: 200,
				series: results[0],
				results: results[1],
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in fetching querysets',
			});
	} catch (err) {
		console.log('error in generateReport : ' + err);
		res.status(500).json({
			status: 500,
			message:
                'error in generateReport :' + err.message ? err.message : err,
		});
	}
};

export const saveReport = async (
	saveReportParams: saveReportInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { querysettagname, metrics, userid, startdate, enddate } =
            saveReportParams;
		const unique =
            moment().valueOf() +
            Math.floor(1000 + Math.random() * 9000).toString();

		const reportData: Report = {
			querysettagname: querysettagname,
			querysetmetricsname: metrics.join('##'),
			startdate: startdate !== null ? startdate : null,
			enddate: enddate !== null ? enddate : null,
			uniquekey: unique,
			savedon: new Date(),
			userid: userid,
			isactive: true,
		};

		const prepareEachRes = new PreparedStatement({
			name: 'report-saveReport-insert',
			text: 'INSERT INTO report (querysettagname, querysetmetricsname, startdate, enddate, uniquekey, savedon, userid, isactive) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
			values: [
				reportData.querysettagname,
				reportData.querysetmetricsname,
				reportData.startdate,
				reportData.enddate,
				reportData.uniquekey,
				reportData.savedon,
				reportData.userid,
				reportData.isactive,
			],
		});
		let reportID = await db.none(prepareEachRes);
		const preparereportID = new PreparedStatement({
			name: 'report-select-reportID',
			text: 'SELECT reportid FROM report where uniquekey=$1',
			values: [unique],
		});
		reportID = await db.one(preparereportID);
		reportID = reportID.reportid;

		if (reportID) res.status(200).json({ status: 200, reportid: reportID });
		else
			res.status(400).json({
				status: 400,
				message: 'Error in saving report',
			});
	} catch (err) {
		console.log('error in saveReport : ' + err);
		res.status(500).json({
			status: 500,
			message: 'error in saveReport :' + err.message ? err.message : err,
		});
	}
};

export const getReport = async (
	getReportData: getReportInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { reportid } = getReportData;
		const prepareReportData = new PreparedStatement({
			name: 'report-getReport',
			text: 'SELECT * FROM report WHERE reportid=$1',
			values: [reportid],
		});
		let reportData = await db.many(prepareReportData);
		reportData = reportData[0];

		const results = await generateReportFunc(
			reportData.querysetmetricsname.split('##'),
			reportData.querysettagname,
			reportData.startdate,
			reportData.enddate
		);
		if (results)
			res.status(200).json({
				status: 200,
				series: results[0],
				results: results[1],
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in fetching querysets',
			});
	} catch (err) {
		console.log('error in getReport : ' + err);
		res.status(500).json({
			status: 500,
			message: 'error in getReport :' + err.message ? err.message : err,
		});
	}
};

export const getSavedReports = async (
	reportParams: getSavedReportsInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { itemsPerPage, pagenumber } = reportParams;
		let queryString =
            'SELECT report.reportid, report.querysettagname,\
      report.startdate,report.enddate,report.querysetmetricsname,\
      users.first_name,users.last_name \
      FROM report \
      JOIN users ON users.id=report.userid \
      WHERE isactive=true \
      ORDER BY report.reportid';
		const prepareTotalCount = new PreparedStatement({
			name: 'report-getSavedReports-totalCount',
			text: queryString,
		});
		let totalCount = await db.many(prepareTotalCount);
		totalCount = totalCount.length;
		queryString +=
            ' OFFSET ' +
            (pagenumber - 1) * itemsPerPage +
            ' LIMIT ' +
            itemsPerPage;
		const prepareReportList = new PreparedStatement({
			name: 'report-getSavedReports-ReportList',
			text: queryString,
		});
		const reportList = await db.many(prepareReportList);

		if (reportList)
			res.status(200).json({
				status: 200,
				reports: reportList,
				totalcount: totalCount,
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in fetching reports',
			});
	} catch (err) {
		console.log('error in getSavedReports : ' + err);
		res.status(500).json({
			status: 500,
			message:
                'error in getSavedReports :' + err.message ? err.message : err,
		});
	}
};

export const deleteReport = async (
	deleteReportData: deleteReportInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { reportid } = deleteReportData;
		const prepareEachRes = new PreparedStatement({
			name: 'report-deleteReport',
			text: 'UPDATE report SET isactive=false WHERE reportid=$1',
			values: [reportid],
		});
		const report = await db.none(prepareEachRes);

		if (report !== undefined)
			res.status(200).json({
				status: 200,
				message: 'Report deleted successfully',
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in deleting report',
			});
	} catch (err) {
		console.log('error in deleteReport : ' + err);
		res.status(500).json({
			status: 500,
			message:
                'error in deleteReport :' + err.message ? err.message : err,
		});
	}
};

export const compareQuerysets = async (
	compareQuerysetsParams: compareQuerysetsInterface,
	res: commonReqResInterface
) => {
	const db = await getConnection();
	try {
		const { querysetids, pagenumber, itemsPerPage } =
            compareQuerysetsParams;
		const compareData: Array<{}> = [];

		await Promise.all(
			querysetids.map(async (eachID) => {
				let queryString =
                    'SELECT queriesid,querystring FROM queries WHERE querysetid=$1 AND isexclude=false \
          ORDER BY queriesid';
				queryString +=
                    ' OFFSET ' +
                    (pagenumber - 1) * itemsPerPage +
                    ' LIMIT ' +
                    itemsPerPage;

				const prepareQueries = new PreparedStatement({
					name: `report-${totalResultLength}-compareQuerysets-queries`,
					text: queryString,
					values: [eachID],
				});
				const queries = await db.many(prepareQueries);
				totalResultLength += 1;

				await Promise.all(
					queries.map(async (eachQuery: { queriesid: number }) => {
						const prepareEachRes = new PreparedStatement({
							name: 'report-compareQuerysets-queryResults',
							text: 'SELECT queryresultsid,actionurl,title,universaltype,resultid,scalerank,typename\
                 FROM queryresults WHERE queriesid=$1 \
                 ORDER BY queryresultsid',
							values: [eachQuery.queriesid],
						});
						const queryResults = await db.many(prepareEachRes);

						eachQuery['queryresults'] = queryResults;
					})
				);

				compareData.push({
					querysetid: eachID,
					queries: queries,
				});
			})
		);

		if (compareData)
			res.status(200).json({ status: 200, comparedata: compareData });
		else
			res.status(400).json({
				status: 400,
				message: 'Error in fetching details',
			});
	} catch (err) {
		console.log('error in compareQuerysets : ' + err);
		res.status(500).json({
			status: 500,
			message:
                'error in compareQuerysets :' + err.message ? err.message : err,
		});
	}
};
