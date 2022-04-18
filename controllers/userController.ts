import * as userservice from '../services/userService';
import { getConnection } from '../db';
import { validateType } from '../helpers/validate';
import { googleAuthSchema } from '../models/schema/importSchema';
import { googleAuthInterface } from '../models/interface/importInterface';
import {
	addUserInterface,
	deleteUserInterface,
	editUserInterface,
	resetPasswordInterface,
	sendPassResetMailInterface,
	signinInterfacer,
	updateUserPasswordInterface,
} from '../models/interface/userInterface';
import {
	addUserSchema,
	deleteUserSchema,
	editUserSchema,
	resetPasswordSchema,
	sendPassResetMailSchema,
	signinSchema,
	updateUserPasswordSchema,
} from '../models/schema/userSchema';
import { PreparedStatement } from 'pg-promise';
import { commonReqResInterface } from '../models/interface/commonReqResInterface';
import { typeSafeDBInterface } from '../models/interface/typeSafeDBInterface';

export const addUser = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	//validate if user details are available
	const validateTypeResult = validateType(req.body, addUserSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const addUserParams: addUserInterface = {
			email: req.body.email,
			firstName: req.body.first_name,
			lastName: req.body.last_name,
			password: req.body.password,
			userRole: req.body.user_role,
		};
		userservice.addUser(addUserParams, res);
	}
};

export const getAllUsers = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	//validate if details are available
	userservice.getAllUsers('', res);
};

export const deleteUser = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateTypeResult = validateType(req.body, deleteUserSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const deleteUserParams: deleteUserInterface = {
			uid: req.body.uid,
		};
		userservice.deleteUser(deleteUserParams, res);
	}
};

export const editUser = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateTypeResult = validateType(req.body, editUserSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const editUserParams: editUserInterface = {
			email: req.body.email,
			firstName: req.body.first_name,
			lastName: req.body.last_name,
			uid: req.body.uid,
			userRole: req.body.user_role,
		};
		userservice.editUser(editUserParams, res);
	}
};

export const signin = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateTypeResult = validateType(req.body, signinSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const signinParams: signinInterfacer = {
			email: req.body.email,
			password: req.body.password,
			fromOAuth: false,
		};
		userservice.signin(signinParams, res);
	}
};

export const sendPassResetMail = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateTypeResult = validateType(req.body, sendPassResetMailSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const sendPassResetMailParams: sendPassResetMailInterface = {
			email: req.body.email,
		};
		userservice.sendPassResetMail(sendPassResetMailParams, res);
	}
};

export const resetPassword = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateTypeResult = validateType(req.body, resetPasswordSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const resetPasswordParams: resetPasswordInterface = {
			uid: req.body.uid,
			otp: req.body.otp,
			password: req.body.password,
		};
		userservice.resetPassword(resetPasswordParams, res);
	}
};
export const updateUserPassword = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateTypeResult = validateType(req.body, updateUserPasswordSchema);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const updateUserPasswordParams: updateUserPasswordInterface = {
			uid: req.body.uid,
			currPassword: req.body.currPassword,
			newPassword: req.body.newPassword,
		};
		userservice.updateUserPassword(updateUserPasswordParams, res);
	}
};

export const getTokenById = async (uid: number) => {
	const db: typeSafeDBInterface = await getConnection();
	const prepareToken = new PreparedStatement({
		name: 'user-get-Token',
		text: 'SELECT token FROM users WHERE id=$1',
		values: [uid],
	});
	const tokenToReturn: Array<{
        token: typeSafeDBInterface;
    }> = await db.one(prepareToken);
	return tokenToReturn;
};

export const googleAuth = async (
	req: commonReqResInterface,
	res: commonReqResInterface
) => {
	const validateTypeResult = validateType(
		{ email: req.user._json.email },
		googleAuthSchema
	);
	if (validateTypeResult.status === false) {
		res.status(400).json({
			status: 400,
			message: validateTypeResult.message,
		});
		return;
	} else {
		const googleAuthParams: googleAuthInterface = {
			email: req.user._json.email,
			password: '',
			fromOAuth: true,
		};
		userservice.signin(googleAuthParams, res);
	}
};
