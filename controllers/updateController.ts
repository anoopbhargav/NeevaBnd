import { validate, validateType } from '../helpers/validate';
import * as updateService from '../services/updateService';
import {
	updateRatingInterface,
	excludeQueryInterface,
	singleSideResultsWithRatingsInterface,
	updateSideBySideRatingInterface,
	deleteQuerysetInterface,
	updateQuerysetMetricInterface,
} from '../models/interface/updateInterface';
import {
	updateRatingSchema,
	excludeQuerySchema,
	singleSideResultsWithRatingsSchema,
	updateSideBySideRatingSchema,
	deleteQuerysetSchema,
	updateQuerysetMetricSchema,
} from '../models/schema/updateSchema';
import { commonReqResInterface } from '../models/interface/commonReqResInterface';

export const excludeQuery = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, ['queriesid', 'isexclude']);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = await validateType(req.body, excludeQuerySchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const excludeQueryRequestParams: excludeQueryInterface = {
			isexclude: req.body.isexclude,
			queriesid: req.body.queriesid,
		};
		updateService.updateQueryExclude(excludeQueryRequestParams, res);
	}
};

export const singleSideResultsWithRatings = async (
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
		singleSideResultsWithRatingsSchema
	);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const singleSideResultsWithRatingsRequestParams: singleSideResultsWithRatingsInterface =
            {
            	queryresultsid: req.body.queryresultsid,
            	queryside: req.body.queryside,
            };
		updateService.singleSideResultDetailsWithRatings(
			singleSideResultsWithRatingsRequestParams,
			res
		);
	}
};

export const updateRating = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, ['overridevalue', 'value']);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(req.body, updateRatingSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const updateRatingRequestParams: updateRatingInterface = {
			overridevalue: req.body.overridevalue,
			value: req.body.value,
			ratingName: req.body.ratingName,
			ratingtype: req.body.ratingtype,
		};
		updateService.updateRatings(updateRatingRequestParams, res);
	}
};

export const updateSideBySideRating = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, ['rating', 'queriesid']);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(
		req.body,
		updateSideBySideRatingSchema
	);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const updateSideBySideRatingRequestParams: updateSideBySideRatingInterface =
            {
            	sidebysideratingsid: req.body.sidebysideratingsid,
            	queriesid: req.body.queriesid,
            	rating: req.body.rating,
            };
		updateService.updateSideBySideRatings(
			updateSideBySideRatingRequestParams,
			res
		);
	}
};

export const deleteQueryset = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, ['querysetid']);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(req.body, deleteQuerysetSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const deleteQuerysetRequestParams: deleteQuerysetInterface = {
			querysetid: req.body.querysetid,
		};
		updateService.deletequeryset(deleteQuerysetRequestParams, res);
	}
};

export const updateQuerysetMetric = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateResult = await validate(req.body, ['querysetid']);
	if (validateResult.status === false) {
		res.status(400).json({ status: 400, message: validateResult.message });
		return;
	}
	const validateTypeResult = validateType(
		req.body,
		updateQuerysetMetricSchema
	);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const updateQuerysetMetricRequestParams: updateQuerysetMetricInterface =
            {
            	querysetid: req.body.querysetid,
            	querysetmetricname: req.body.querysetmetricname,
            };
		updateService.updateQuerysetMetric(
			updateQuerysetMetricRequestParams,
			res
		);
	}
};
