import { validate, validateType } from '../helpers/validate';
import * as studyService from '../services/studyService';
import {
	getQueryresultsInterface,
	getSideBySideQueryResultsListInterface,
	getSideBySideResultsInterface,
	addNotesInterface,
	getAllNotesInterface,
	getSingleSideResultsInterface,
	getQuerysetsInterface,
	getQueriesInterface,
} from '../models/interface/studyInterface';
import {
	getQueryresultsSchema,
	getSideBySideQueryResultsListSchema,
	getSideBySideResultsSchema,
	addNotesSchema,
	getAllNotesSchema,
	getSingleSideResultsSchema,
	getQuerysetsSchema,
	getQueriesSchema,
} from '../models/schema/studySchema';
import { commonReqResInterface } from '../models/interface/commonReqResInterface';

export const getQueries = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, [
		'querysetid',
		'pagenumber',
		'itemsPerPage',
	]);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(req.body, getQueriesSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const getQueriesRequestParams: getQueriesInterface = {
			fromSideBySide: req.body.fromSideBySide,
			itemsPerPage: req.body.itemsPerPage,
			pagenumber: req.body.pagenumber,
			querysetid: req.body.querysetid,
			page: req.body.page,
			filterValueMax: req.body.filterValueMax,
			filterValueMin: req.body.filterValueMin,
			filterParam: req.body.filterParam,
			sortingOrder: req.body.sortingOrder,
			sortingParam: req.body.sortingParam,
			querytags: req.body.querytags,
			querytagstype: req.body.querytagstype,
			searchParam: req.body.searchParam,
		};
		studyService.getQueriesList(getQueriesRequestParams, res);
	}
};

export const getQuerysets = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, [
		'querysettype',
		'pagenumber',
		'itemsPerPage',
	]);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(req.body, getQuerysetsSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const getQuerysetsRequestParams: getQuerysetsInterface = {
			itemsPerPage: req.body.itemsPerPage,
			pagenumber: req.body.pagenumber,
			filterValueMax: req.body.filterValueMax,
			filterValueMin: req.body.filterValueMin,
			querysettype: req.body.querysettype,
			filterParam: req.body.filterParam,
			sortingOrder: req.body.sortingOrder,
			sortingParam: req.body.sortingParam,
			searchParam: req.body.searchParam,
		};
		studyService.getQuerysetsList(getQuerysetsRequestParams, res);
	}
};

export const getQueryresults = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, [
		'queriesid',
		'pagenumber',
		'itemsPerPage',
	]);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(req.body, getQueryresultsSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const getQueryresultsRequestParams: getQueryresultsInterface = {
			itemsPerPage: req.body.itemsPerPage,
			pagenumber: req.body.pagenumber,
			queriesid: req.body.queriesid,
			searchParam: req.body.searchParam,
		};
		studyService.getQueryresultsList(getQueryresultsRequestParams, res);
	}
};

export const getsideBySideQueryResults = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, ['queriesid']);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(
		req.body,
		getSideBySideQueryResultsListSchema
	);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const getSideBySideQueryResultsListRequestParams: getSideBySideQueryResultsListInterface =
            {
            	queriesid: req.body.queriesid,
            };
		studyService.getSideBySideQueryResultsList(
			getSideBySideQueryResultsListRequestParams,
			res
		);
	}
};

export const singleSideResults = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, ['queryresultsid']);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(
		req.body,
		getSingleSideResultsSchema
	);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const getSingleSideResultsRequestParams: getSingleSideResultsInterface =
            {
            	queryresultsid: req.body.queryresultsid,
            	queryside: req.body.queryside,
            };
		studyService.getSingleSideResults(
			getSingleSideResultsRequestParams,
			res
		);
	}
};

export const sideBySideResults = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, [
		'queryresultsidcontrol',
		'queryresultsidexp',
	]);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(
		req.body,
		getSideBySideResultsSchema
	);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const getSideBySideResultsRequestParams: getSideBySideResultsInterface =
            {
            	queryresultsidcontrol: req.body.queryresultsidcontrol,
            	queryresultsidexp: req.body.queryresultsidexp,
            };
		studyService.getSideBySideResults(
			getSideBySideResultsRequestParams,
			res
		);
	}
};

export const addNotes = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, [
		'querysetid',
		'userid',
		'content',
	]);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(req.body, addNotesSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const addNotesRequestParams: addNotesInterface = {
			querysetid: req.body.querysetid,
			userid: req.body.userid,
			content: req.body.content,
		};
		studyService.addNotes(addNotesRequestParams, res);
	}
};

export const getAllNotes = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, ['querysetid']);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(req.body, getAllNotesSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const getAllNotesRequestParams: getAllNotesInterface = {
			querysetid: req.body.querysetid,
			searchParam: req.body.searchParam,
		};
		studyService.getAllNotes(getAllNotesRequestParams, res);
	}
};
