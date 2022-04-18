import { PreparedStatement } from 'pg-promise';
import { getConnection } from '../db';
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
require('dotenv').config();
import {
	addUserInterface,
	deleteUserInterface,
	editUserInterface,
	resetPasswordInterface,
	sendPassResetMailInterface,
	signinInterfacer,
	updateUserPasswordInterface,
} from '../models/interface/userInterface';
import { commonReqResInterface } from '../models/interface/commonReqResInterface';

export const signin = async (
	userData: signinInterfacer,
	res: commonReqResInterface
) => {
	try {
		const db = await getConnection();
		const { email, password, fromOAuth } = userData;
		const preprareResult = new PreparedStatement({
			name: 'user-get-result',
			text: 'SELECT id,token,user_role,password FROM users WHERE email=$1 AND is_active=$2',
			values: [email, true],
		});
		const result = await db.many(preprareResult);

		if (result.length === 0)
			res.status(201).json({
				status: 201,
				message: 'This email does not exist.',
			});
		else if (fromOAuth === true) {
			const token = jwt.sign(
				{ uid: result[0].id },
				process.env.JWT_SECRET
			);
			await updateTokenUser(result[0].id, token);
			res.status(200).json({
				status: 200,
				message: 'Success',
				token: token,
				uid: result[0].id,
				role: result[0].user_role,
			});
		} else {
			const passwordmatch = await decryptPass(
				result[0].password,
				password
			);
			if (passwordmatch === false)
				res.status(201).json({
					status: 201,
					message: 'Incorrect Password',
				});
			else {
				const token = jwt.sign(
					{ uid: result[0].id },
					process.env.JWT_SECRET
				);
				await updateTokenUser(result[0].id, token);
				res.status(200).json({
					status: 200,
					message: 'Success',
					token: token,
					uid: result[0].id,
					role: result[0].user_role,
				});
			}
		}
	} catch (err) {
		console.log('error in signin : ', err);
		res.status(500).json({
			status: 500,
			message: 'error in signin :' + err.message ? err.message : err,
		});
	}
};

export const getAllUsers = async (req: string, res: commonReqResInterface) => {
	try {
		const db = await getConnection();
		const prepareAllUsers = new PreparedStatement({
			name: 'user-getAllUser',
			text: 'SELECT first_name,last_name,id,email,is_active,user_role FROM users ORDER BY addedon DESC',
		});
		const allUsers = await db.many(prepareAllUsers);
		if (allUsers) {
			res.status(200).json({
				status: 200,
				message: 'Success',
				users: allUsers,
			});
		} else {
			res.status(400).json({
				status: 400,
				message: 'Error in fetching users',
			});
		}
	} catch (err) {
		console.log('error in getAllUsers : ', err);
		res.status(500).json({
			status: 500,
			message: 'error in getAllUsers :' + err.message ? err.message : err,
		});
	}
};

export const deleteUser = async (
	deleteUserData: deleteUserInterface,
	res: commonReqResInterface
) => {
	try {
		const db = await getConnection();
		const { uid } = deleteUserData;
		const preprareResult = new PreparedStatement({
			name: 'user-delete',
			text: 'UPDATE users SET is_active=$1 WHERE id=$2',
			values: [false, uid],
		});
		const result = await db.none(preprareResult);
		if (result !== undefined) {
			res.status(200).json({
				status: 200,
				message: 'User deleted successfully',
			});
		} else {
			res.status(400).json({
				status: 400,
				message: 'Error in deleting user',
			});
		}
	} catch (err) {
		console.log('error in deleteUser : ', err);
		res.status(500).json({
			status: 500,
			message: 'error in deleteUser :' + err.message ? err.message : err,
		});
	}
};

export const editUser = async (
	editUserData: editUserInterface,
	res: commonReqResInterface
) => {
	try {
		const db = await getConnection();
		const { firstName, lastName, email, userRole, uid } = editUserData;
		const preprareResult = new PreparedStatement({
			name: 'user-edit',
			text: 'UPDATE users SET first_name=$1,last_name=$2,email=$3,user_role=$4 WHERE id=$5',
			values: [firstName, lastName, email, userRole, uid],
		});
		const result = await db.none(preprareResult);
		if (result !== undefined)
			res.status(200).json({
				status: 200,
				message: 'User updated successfully',
			});
		else
			res.status(400).json({
				status: 400,
				message: 'Error in updating user',
			});
	} catch (err) {
		console.log('error in editUser : ', err);
		res.status(500).json({
			status: 500,
			message: 'error in editUser :' + err.message ? err.message : err,
		});
	}
};

export const addUser = async (
	addUserData: addUserInterface,
	res: commonReqResInterface
) => {
	try {
		const { firstName, lastName, email, password, userRole } = addUserData;

		const user = await checkUserExist(email);
		if (user.length > 0)
			res.status(201).json({
				status: 201,
				message: 'This email already exists',
			});
		else {
			const token = '';
			const isActive = true;
			const otp = '';
			const addedon = new Date();
			const passwordVariable = await encryptPass(password);
			const db = await getConnection();
			const preprareResult = new PreparedStatement({
				name: 'user-add',
				text: 'INSERT INTO users(first_name, last_name, email,user_role,password,token,is_active,otp,addedon) \
       VALUES($1, $2, $3,$4,$5,$6,$7,$8,$9)',
				values: [
					firstName,
					lastName,
					email,
					userRole,
					passwordVariable,
					token,
					isActive,
					otp,
					addedon,
				],
			});
			const addUser = await db.none(preprareResult);
			if (addUser !== undefined)
				res.status(200).json({
					status: 200,
					message: 'User added successfully',
				});
			else
				res.status(400).json({
					status: 400,
					message: 'Error in creating user',
				});
		}
	} catch (err) {
		console.log('error in adding user : ', err);
		res.status(500).json({
			status: 500,
			message: 'error in adding user :' + err.message ? err.message : err,
		});
	}
};

export const sendPassResetMail = async (
	sendPassResetMailData: sendPassResetMailInterface,
	res: commonReqResInterface
) => {
	const sendMail = require('../helpers/sendMail');
	try {
		const { email } = sendPassResetMailData;
		const user = await checkUserExist(email);
		if (user.length > 0) {
			const otp = String(Math.floor(Math.random() * 1000000 + 1));
			const result = await sendMail.passResetMail(email, otp);
			if (result) {
				await updateOtp(user[0].id, otp);
				res.status(200).json({
					status: 200,
					message: 'OTP is sent to ' + email,
					uid: user[0].id,
				});
			} else
				res.status(400).json({
					status: 400,
					message: 'Error sending mail',
				});
		} else
			res.status(201).json({
				status: 201,
				message: 'This email does not exist',
			});
	} catch (err) {
		console.log('error in sending OTP for password reset : ', err);
		res.status(500).json({
			status: 500,
			message: 'error in sending OTP for password reset :' + err,
		});
	}
};

export const resetPassword = async (
	resetPasswordData: resetPasswordInterface,
	res: commonReqResInterface
) => {
	try {
		const { uid, otp, password } = resetPasswordData;
		const result = await getOtpById(uid);
		if (result.otp === otp) {
			const encPassword = await encryptPass(password);
			const updatePass = await updatePassword(uid, encPassword);
			if (updatePass)
				res.status(200).json({
					status: 200,
					message: 'Password reset is successfull',
				});
			else
				res.status(400).json({
					status: 400,
					message: 'Error in updating password',
				});
		} else res.status(201).json({ status: 201, message: 'Invalid OTP' });
	} catch (err) {
		console.log('error in reset password : ', err);
		res.status(500).json({
			status: 500,
			message: 'error in reset password :' + err,
		});
	}
};

export const updateUserPassword = async (
	updateUserPasswordData: updateUserPasswordInterface,
	res: commonReqResInterface
) => {
	try {
		const db = await getConnection();
		const { uid, currPassword, newPassword } = updateUserPasswordData;
		const preprareResult = new PreparedStatement({
			name: 'user-updateUsePassword',
			text: 'SELECT id,token,user_role,password FROM users WHERE id=$1 AND is_active=$2',
			values: [uid, true],
		});
		const result = await db.one(preprareResult);
		if (result.length === null)
			res.status(201).json({
				status: 201,
				message: 'User does not exist.',
			});
		else {
			const passwordMatch = await decryptPass(
				result.password,
				currPassword
			);
			if (passwordMatch === false)
				res.status(201).json({
					status: 201,
					message: 'Incorrect old password',
				});
			else {
				const password = await encryptPass(newPassword);
				const updatePass = await updatePassword(uid, password);
				if (updatePass)
					res.status(200).json({
						status: 200,
						message: 'Password update is successfull',
					});
				else
					res.status(400).json({
						status: 400,
						message: 'Error in updating password',
					});
			}
		}
	} catch (err) {
		console.log('error in update password : ', err);
		res.status(500).json({
			status: 500,
			message:
                'error in update password :' + err.message ? err.message : err,
		});
	}
};

const encryptPass = (password: string) => {
	return bcrypt.hash(password, saltRounds);
};

const decryptPass = (hashedPass: string, password: string) => {
	return bcrypt.compare(password, hashedPass);
};

const checkUserExist = async (email: string) => {
	const db = await getConnection();
	const preprareResult = new PreparedStatement({
		name: 'user-CheckUserExist',
		text: 'SELECT email,id FROM users WHERE email=$1 AND is_active=$2',
		values: [email, true],
	});
	return await db.any(preprareResult);
};

const updateTokenUser = async (uid: number, token: string) => {
	const db = await getConnection();
	const preprareResult = new PreparedStatement({
		name: 'user-updateTokenUser',
		text: 'UPDATE users SET token=$1 WHERE id=$2',
		values: [token, uid],
	});
	return await db.none(preprareResult);
};

const updateOtp = async (id: number, otp: string) => {
	const db = await getConnection();
	const preprareResult = new PreparedStatement({
		name: 'user-updateOtp',
		text: 'UPDATE users SET otp=$1 WHERE id=$2',
		values: [otp, id],
	});
	return await db.none(preprareResult);
};

const getOtpById = async (id: number) => {
	const db = await getConnection();
	const preprareResult = new PreparedStatement({
		name: 'user-getOtpById',
		text: 'SELECT otp FROM users WHERE id=$1',
		values: [id],
	});
	return await db.one(preprareResult);
};

const updatePassword = async (id: number, password: string) => {
	const db = await getConnection();
	const preprareResult = new PreparedStatement({
		name: 'user-updatePassword',
		text: 'UPDATE users SET password=$1 WHERE id=$2',
		values: [password, id],
	});
	return await db.any(preprareResult);
};
