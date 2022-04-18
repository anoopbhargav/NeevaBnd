export const validate = (reqobj: object, param: Array<string>) => {
	const message = {};
	param.map((eachParam) => {
		if (!(eachParam in reqobj))
			message[eachParam] = eachParam + ' is required';
		if (reqobj[eachParam] === '')
			message[eachParam] = eachParam + ' cannot be empty';
	});
	if (Object.keys(message).length > 0)
		return { message: message, status: false };
	else return { status: true };
};

export const validateType = (reqObj: any, paramsData: any) => {
	const objKeys = Object.keys(reqObj);
	for (let eachParam in objKeys) {
		eachParam = objKeys[eachParam];
		if (!(eachParam in paramsData)) {
			return { message: `${eachParam} invalid param`, status: false };
		} else {
			const params = paramsData[eachParam].split(':');
			const type = params[0];
			const length = params[1];
			const permitSpecialCharacter = params[2];
			if (typeof reqObj[eachParam] !== type) {
				return {
					message: `${eachParam} datatype is invalid`,
					status: false,
				};
			} else if (typeof reqObj[eachParam] === 'string') {
				if (permitSpecialCharacter === 'true') {
					// checking additional special character for email and password
					if (
						eachParam === 'email' ||
                        eachParam === 'password' ||
                        eachParam === 'currPassword' ||
                        eachParam === 'newPassword'
					) {
						if (
							reqObj[eachParam].match(/[^0-9a-zA-Z@./: ]/g) !==
                            null
						) {
							return {
								message: `${eachParam} can't proceed with special character`,
								status: false,
							};
						}
					} else {
						if (
							reqObj[eachParam].match(
								/[^0-9a-zA-Z_\-/:<>=., ]/g
							) !== null
						) {
							return {
								message: `${eachParam} can't proceed with special character`,
								status: false,
							};
						}
					}
				} else {
					if (reqObj[eachParam].match(/[^0-9a-zA-Z ]/g) !== null) {
						return {
							message: `${eachParam} can't proceed with special character`,
							status: false,
						};
					}
				}
				if (reqObj[eachParam].length > length) {
					return {
						message: `${eachParam} Data is too long`,
						status: false,
					};
				}
				if (reqObj[eachParam].includes(';')) {
					return {
						message: `can't proceed with semicolumn in the ${eachParam}`,
						status: false,
					};
				}
			} else if (
				typeof reqObj[eachParam] === 'number' &&
                Number.isNaN(reqObj[eachParam])
			) {
				return {
					message: `${eachParam} can't proceed NaN.`,
					status: false,
				};
			} else if (typeof reqObj[eachParam] === 'object') {
				if (!Array.isArray(reqObj[eachParam])) {
					return {
						message: `${eachParam} datatype is invalid`,
						status: false,
					};
				}
			}
		}
	}
	return { status: true };
};
