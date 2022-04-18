const fs = require('fs');
const path = require('path');
const moment = require('moment');

import { validateType } from '../helpers/validate';
import { importQuerySetsInterface } from '../models/interface/importInterface';
import { commonReqResInterface } from '../models/interface/commonReqResInterface';
import { importQuerySetsSchema } from '../models/schema/importSchema';
import { loadJsonDataToDataBase } from '../services/importService';
import { jsonDataInterface } from '../models/interface/jsonDataInterface';

require('dotenv').config();

export const importQuerySets = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	console.log('entering  import');
	const originalFileName = req.file.originalname;
	const savedFileName = req.file.filename;
	console.log(
		'filename : ' + originalFileName + 'saved as : ' + savedFileName
	);

	let errorMessageToReturn = '';
	let jsonfile: string;
	let jsondata: jsonDataInterface;
	try {
		jsonfile = fs.readFileSync(
			path.join(__dirname, '../uploads/' + savedFileName)
		);
	} catch (err) {
		console.log('err in reading json file : ', err);
		errorMessageToReturn += '<br /> error in reading json file : ' + err;
		res.status(500).json({ status: 500, message: errorMessageToReturn });
		return;
	}
	try {
		console.time('JSON PARSE=>');
		jsondata = JSON.parse(jsonfile);
		console.timeEnd('JSON PARSE=>');
	} catch (err) {
		console.log('err in parsing the file : ', err);
		errorMessageToReturn += '<br /> error in parsing the file : ' + err;
		res.status(500).json({ status: 500, message: errorMessageToReturn });
		return;
	}
	req.body.userid = Number(req.body.userid);
	const validateTypeResult = validateType(req.body, importQuerySetsSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const importQuerySetsParams: importQuerySetsInterface = {
			fileName: req.body.fileName,
			filename: req.body.filename,
			querysetdescription: req.body.querysetdescription,
			querysettype: req.body.querysettype,
			tags: req.body.tags,
			userid: req.body.userid,
		};
		loadJsonDataToDataBase(
			jsondata,
			errorMessageToReturn,
			originalFileName,
			savedFileName,
			importQuerySetsParams,
			res
		);
	}
};

function returnInvalidS3Url(res: commonReqResInterface, err: string) {
	const errorMessageToReturn: string = 'Invalid S3 url : ' + err;
	console.log(errorMessageToReturn);
	res.status(500).json({ status: 500, message: errorMessageToReturn });
}

export const importQuerySetS3 = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const AWS = require('aws-sdk');
	let errorMessageToReturn = '';
	const originalFileName: string = req.body.fileName;
	const unique: string =
        moment().valueOf() + Math.floor(1000 + Math.random() * 9000).toString();
	const savedFileName: string = unique;
	let s3url: string = req.body.fileName;
	if (s3url) {
		s3url = s3url.trim();
	} else {
		returnInvalidS3Url(res, 'S3 url : ' + s3url);
		return;
	}
	const startIndex: number = s3url.indexOf('//') + 2;
	const bucketEndIndex: number = s3url.indexOf('/', startIndex);
	const bucket: string = s3url.substring(startIndex, bucketEndIndex);
	const key: string = s3url.substring(bucketEndIndex + 1, s3url.length);
	console.log('S3 url : ' + s3url);
	console.log('S3 Bucket : ' + bucket);
	console.log('S3 key : ' + key);
	if (!(key && key.length > 0 && bucket && bucket.length > 0)) {
		returnInvalidS3Url(
			res,
			' Bucket : ' + bucket
				? bucket
				: 'NA' + ' and Key : ' + key
					? key
					: 'NA'
		);
		return;
	}
	const params = {
		Bucket: bucket,
		Key: key,
	};
	//comment this line if IAM based access is not needed
	//AWS.config.loadFromPath("./S3Credentials.json");

	//Uncomment this if IAM based access is not needed
	// const config = require("./../config");
	// AWS.config.update({ region: config.s3region });

	const s3 = new AWS.S3();
	s3.getObject(params, function (err: any, data: any) {
		if (err) {
			errorMessageToReturn = 'Error in getting the file from S3 : ' + err;
			console.log(errorMessageToReturn);
			res.status(500).json({
				status: 500,
				message: errorMessageToReturn,
			});
			return;
		} else {
			let jsonData: jsonDataInterface;
			let recdFileContents;
			try {
				recdFileContents = data.Body;
				jsonData = JSON.parse(recdFileContents);
				console.log(
					'line 106 -> json object data length',
					Object.keys(jsonData).length
				);
				Object.keys(jsonData).map((eachKey) => {
					console.log(
						'line 108 Each json data key and it\'s length ->',
						eachKey,
						jsonData[eachKey]?.length
					);
				});
				jsonData.Queries.map((eachVal) => {
					console.log(
						'line 111 Each Queries Query Name',
						eachVal?.Query
					);
				});
			} catch (err) {
				console.log('err in reading json file : ', err);
				errorMessageToReturn +=
                    '<br /> error in reading json file : ' + err;
				res.status(500).json({
					status: 500,
					message: errorMessageToReturn,
				});
				return;
			}

			//write jsonData to a file on server?
			const fs = require('fs');
			fs.writeFile(
				path.join(__dirname, '../uploads/' + unique),
				JSON.stringify(jsonData),
				function (err: any) {
					if (err) {
						console.log('Error in saving json file : ', err);
						errorMessageToReturn +=
                            '<br /> Error in saving json file : ' + err;
					}
				}
			);

			console.log(
				'line 133 -> Passing data to loadJsonDataToDataBase function'
			);
			req.body.userid = Number(req.body.userid);
			const validateTypeResult = validateType(
				req.body,
				importQuerySetsSchema
			);
			if (validateTypeResult.status === false) {
				res.status(400).json({
					status: 400,
					message: validateTypeResult.message,
				});
				return;
			} else {
				const importQuerySetsParams: importQuerySetsInterface = {
					fileName: req.body.fileName,
					filename: req.body.filename,
					querysetdescription: req.body.querysetdescription,
					querysettype: req.body.querysettype,
					tags: req.body.tags,
					userid: req.body.userid,
				};
				loadJsonDataToDataBase(
					jsonData,
					errorMessageToReturn,
					originalFileName,
					savedFileName,
					importQuerySetsParams,
					res
				);
			}
		}
	});
};
