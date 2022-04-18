interface commonDataInterface {
	originalname: string;
	filename: string;
	userid: number;
	fileName: string;
	querysetdescription: string;
	tags: string;
	querysettype: string;
	itemsPerPage: number;
	pagenumber: number;
	querysettagname: string;
	metrics: Array<string>;
	enddate: string;
	startdate: string;
	reportid: number;
	querysetids: Array<string>;
	querysetid: number;
	page: number;
	filterValueMax: number;
	filterValueMin: number;
	filterParam: string;
	sortingOrder: string;
	sortingParam: string;
	querytags: string;
	querytagstype: string;
	searchParam: string;
	fromSideBySide: boolean;
	queriesid: number;
	queryresultsid: number;
	queryside: string;
	queryresultsidcontrol: number;
	queryresultsidexp: number;
	content: string;
	isexclude: boolean;
	overridevalue: number;
	value: number;
	ratingName: string;
	ratingtype: string;
	sidebysideratingsid: number;
	rating: string;
	querysetmetricname: string;
	email: string;
	first_name: string;
	last_name: string;
	password: string;
	user_role: string;
	uid: number;
	otp: number;
	currPassword: string;
	newPassword: string;
	_json: commonReqResInterface;
}

export interface commonReqResInterface {
    status: Function;
    one: Function;
    none: Function;
    syscall: string;
    code: string;
    file: commonDataInterface;
    body: commonDataInterface;
    params: commonDataInterface;
    user: commonDataInterface;
    email: string;
    sendFile: Function;
}
