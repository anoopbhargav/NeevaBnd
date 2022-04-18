export const updateQuerysetMetricSchema = {
	querysetid: 'number',
	querysetmetricname: 'string:100:true',
};

export const deleteQuerysetSchema = {
	querysetid: 'number',
};

export const updateSideBySideRatingSchema = {
	sidebysideratingsid: 'number',
	queriesid: 'number',
	rating: 'string:100:true',
};

export const singleSideResultsWithRatingsSchema = {
	queryresultsid: 'number',
	queryside: 'string:100',
};

export const excludeQuerySchema = {
	isexclude: 'boolean',
	queriesid: 'number',
};

export const updateRatingSchema = {
	overridevalue: 'number',
	value: 'number',
	ratingName: 'string:100:true',
	ratingtype: 'string:100',
};
