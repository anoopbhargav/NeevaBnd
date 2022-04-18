import { validate, validateType } from '../helpers/validate';
import * as reportService from '../services/reportService';
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
import {
	getQuerysetTagsSchema,
	getQuerysetsByTagsSchema,
	generateReportSchema,
	saveReportSchema,
	getReportSchema,
	getSavedReportsSchema,
	deleteReportSchema,
	compareQuerysetsSchema,
} from '../models/schema/reportSchema';
import { commonReqResInterface } from '../models/interface/commonReqResInterface';

export const getQuerysetTags = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, [
		'itemsPerPage',
		'pagenumber',
	]);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(req.body, getQuerysetTagsSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const getQuerysetTagsParams: getQuerysetTagsInterface = {
			itemsPerPage: req.body.itemsPerPage,
			pagenumber: req.body.pagenumber,
		};
		reportService.getTags(getQuerysetTagsParams, res);
	}
};

export const getQuerysetsByTags = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, ['querysettagname']);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(req.body, getQuerysetsByTagsSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const getQuerysetsByTagsParams: getQuerysetsByTagsInterface = {
			querysettagname: req.body.querysettagname,
		};
		reportService.getQuerysetsListByTags(getQuerysetsByTagsParams, res);
	}
};

export const generateReport = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, [
		'querysettagname',
		'metrics',
	]);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(req.body, generateReportSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const generateReportParams: generateReportInterface = {
			querysettagname: req.body.querysettagname,
			metrics: req.body.metrics,
			enddate: req.body.enddate,
			startdate: req.body.startdate,
		};
		reportService.generateReport(generateReportParams, res);
	}
};

export const saveReport = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, [
		'metrics',
		'querysettagname',
		'userid',
	]);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(req.body, saveReportSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const saveReportParams: saveReportInterface = {
			querysettagname: req.body.querysettagname,
			metrics: req.body.metrics,
			userid: req.body.userid,
			startdate: req.body.startdate,
			enddate: req.body.enddate,
		};
		reportService.saveReport(saveReportParams, res);
	}
};

export const getReport = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.params, ['reportid']);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	req.params.reportid = Number(req.params.reportid);
	const validateTypeResult = validateType(req.params, getReportSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const getReportParams: getReportInterface = {
			reportid: req.params.reportid,
		};
		reportService.getReport(getReportParams, res);
	}
};

export const getSavedReports = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, [
		'itemsPerPage',
		'pagenumber',
	]);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(req.body, getSavedReportsSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const reportParams: getSavedReportsInterface = {
			itemsPerPage: req.body.itemsPerPage,
			pagenumber: req.body.pagenumber,
		};
		reportService.getSavedReports(reportParams, res);
	}
};

export const deleteReport = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, ['reportid']);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(req.body, deleteReportSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const deleteReportParams: deleteReportInterface = {
			reportid: req.body.reportid,
		};
		reportService.deleteReport(deleteReportParams, res);
	}
};

export const compareQuerysets = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, [
		'querysetids',
		'pagenumber',
		'itemsPerPage',
	]);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(req.body, compareQuerysetsSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const compareQuerysetsParams: compareQuerysetsInterface = {
			querysetids: req.body.querysetids,
			pagenumber: req.body.pagenumber,
			itemsPerPage: req.body.itemsPerPage,
		};
		reportService.compareQuerysets(compareQuerysetsParams, res);
	}
};
