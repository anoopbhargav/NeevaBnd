export const getQuerysetTagsSchema = {
	itemsPerPage: 'number',
	pagenumber: 'number',
};

export const getQuerysetsByTagsSchema = {
	querysettagname: 'string:100',
};

export const generateReportSchema = {
	enddate: 'string:100:true',
	querysettagname: 'string:100',
	metrics: 'object',
	startdate: 'string:100:true',
};

export const saveReportSchema = {
	metrics: 'object',
	querysettagname: 'string:100',
	userid: 'number',
	startdate: 'string:100:true',
	enddate: 'string:100:true',
};

export const getReportSchema = {
	reportid: 'number',
};

export const getSavedReportsSchema = {
	itemsPerPage: 'number',
	pagenumber: 'number',
};

export const deleteReportSchema = {
	reportid: 'number',
};

export const compareQuerysetsSchema = {
	querysetids: 'object',
	pagenumber: 'number',
	itemsPerPage: 'number',
};
