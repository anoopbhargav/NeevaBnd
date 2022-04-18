const pgp = require('pg-promise')({
	capSQL: true,
});

export const csAttempts = new pgp.helpers.ColumnSet(
	[
		'ratingsattemptsid',
		'ratingsid',
		'ratingstype',
		'rater',
		'ratingvaluebool',
		'ratingvaluefloat',
		'ratingvaluestring',
	],
	{ table: 'ratingsattempts' }
);

export const csQuerysettags = new pgp.helpers.ColumnSet(
	['querysetid', 'querysettagname'],
	{ table: 'querysettags' }
);

export const csQuerysetsidemetadata = new pgp.helpers.ColumnSet(
	[
		'querysetid',
		'sidemetadatatype',
		'sidemetadatadocsignals',
		'sidemetadatarank',
	],
	{ table: 'querysetsidemetadata' }
);

export const csQuerysetratingscales = new pgp.helpers.ColumnSet(
	['querysetid', 'ratingtype', 'ratingkey', 'ratingvalue'],
	{ table: 'querysetratingscales' }
);

export const csQuerysetmetrics = new pgp.helpers.ColumnSet(
	[
		'querysetid',
		'querysetmetricsname',
		'querysetmetricsdefaultparam',
		'querysetmetricsdefaultparamvalue',
		'querysetmetricsdefaultvalue',
		'querysetmetricscontrolparam',
		'querysetmetricscontrolparamvalue',
		'querysetmetricscontrolvalue',
		'querysetmetricsexperimentparam',
		'querysetmetricsexperimentparamvalue',
		'querysetmetricsexperimentvalue',
	],
	{ table: 'querysetmetrics' }
);

export const csQueries = new pgp.helpers.ColumnSet(
	[
		'queriesid',
		'querysetid',
		'neevalogsrequestidcontrol',
		'neevalogsrequestidexperiment',
		'querystring',
		'querycompletedat',
		'querytaskid',
		'queryuniqueid',
		'queryupdatedat',
		'usercityname',
		'isexclude',
		'uniquekey',
		'totalresults',
	],
	{
		table: 'queries',
	}
);

export const csQuerymetrics = new pgp.helpers.ColumnSet(
	[
		'queriesid',
		'querymetricsname',
		'querymetricsdefaultparam',
		'querymetricsdefaultparamvalue',
		'querymetricsdefaultvalue',
		'querymetricscontrolparam',
		'querymetricscontrolparamvalue',
		'querymetricscontrolvalue',
		'querymetricsexperimentparam',
		'querymetricsexperimentparamvalue',
		'querymetricsexperimentvalue',
	],
	{ table: 'querymetrics' }
);

export const csQueryratings = new pgp.helpers.ColumnSet(
	[
		'queryratingsid',
		'queriesid',
		'aggregatedvalue',
		'overridevalue',
		'queryratingname',
		'ratingscale',
		'uniquekey',
	],
	{ table: 'queryratings' }
);

export const csQueryresults = new pgp.helpers.ColumnSet(
	[
		'queryresultsid',
		'queriesid',
		'actionurl',
		'resultid',
		'scalerank',
		'segments',
		'snippet',
		'title',
		'typename',
		'universaltype',
		'uniquekey',
	],
	{ table: 'queryresults' }
);

export const csResultratings = new pgp.helpers.ColumnSet(
	[
		'resultratingsid',
		'queryresultsid',
		'aggregatedvalue',
		'overridevalue',
		'resultratingname',
		'ratingscale',
		'uniquekey',
	],
	{ table: 'resultratings' }
);

export const csResultsidemetadata = new pgp.helpers.ColumnSet(
	[
		'queryresultsid',
		'sidemetadatatype',
		'sidemetadatadocsignals',
		'sidemetadatarank',
		'sidemetadatatitle',
		'sidemetadatasnippet',
		'excludefrommainmetrics',
		'koalascore',
		'koalashard',
	],
	{ table: 'resultsidemetadata' }
);

export const csValuetable = new pgp.helpers.ColumnSet(
	['valuetableid', 'valuebool', 'valuefloat', 'valuestring', 'uniquekey'],
	{ table: 'valuetable' }
);

export const csSidebysideratings = new pgp.helpers.ColumnSet(
	['sidebysideratingsid', 'queriesid', 'ratingtext'],
	{ table: 'sidebysideratings' }
);

export const csQuerytags = new pgp.helpers.ColumnSet(
	['querytagid', 'queriesid', 'querytagtype', 'querytagname'],
	{ table: 'querytags' }
);
