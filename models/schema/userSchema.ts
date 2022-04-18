export const addUserSchema = {
	email: 'string:100:true',
	first_name: 'string:100',
	last_name: 'string:100',
	password: 'string:100:true',
	user_role: 'string:100',
};

export const editUserSchema = {
	email: 'string:100:true',
	first_name: 'string:100',
	last_name: 'string:100',
	uid: 'number',
	user_role: 'string:100',
};

export const deleteUserSchema = {
	uid: 'number',
};

export const signinSchema = {
	email: 'string:100:true',
	password: 'string:100:true',
};

export const sendPassResetMailSchema = {
	email: 'string:100:true',
};

export const resetPasswordSchema = {
	uid: 'number',
	otp: 'number',
	password: 'string:100:true',
};

export const updateUserPasswordSchema = {
	uid: 'number',
	currPassword: 'string:100:true',
	newPassword: 'string:100:true',
};
