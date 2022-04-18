export const getQuerysetsSchema = {
	itemsPerPage: 'number',
	pagenumber: 'number',
	filterValueMax: 'number',
	filterValueMin: 'number',
	querysettype: 'string:100',
	filterParam: 'string:100:true',
	sortingOrder: 'string:100',
	sortingParam: 'string:100:true',
	searchParam: 'string:100:true',
};

export const getQueriesSchema = {
	fromSideBySide: 'boolean',
	itemsPerPage: 'number',
	pagenumber: 'number',
	querysetid: 'number',
	page: 'string:100:true',
	filterValueMax: 'number',
	filterValueMin: 'number',
	filterParam: 'string:100:true',
	sortingOrder: 'string:100',
	sortingParam: 'string:100:true',
	querytags: 'string:100:true',
	querytagstype: 'string:100',
	searchParam: 'string:100:true',
};

export const getSingleSideResultsSchema = {
	queryresultsid: 'number',
	queryside: 'string:100',
};

export const getAllNotesSchema = {
	querysetid: 'number',
	searchParam: 'string:100',
};

export const addNotesSchema = {
	querysetid: 'number',
	userid: 'number',
	content: 'string:100',
};

export const getSideBySideResultsSchema = {
	queryresultsidcontrol: 'number',
	queryresultsidexp: 'number',
};

export const getSideBySideQueryResultsListSchema = {
	queriesid: 'number',
};

export const getQueryresultsSchema = {
	itemsPerPage: 'number',
	pagenumber: 'number',
	queriesid: 'number',
	searchParam: 'string:100:true',
};
