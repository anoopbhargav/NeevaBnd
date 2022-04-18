const nodemailer = require('nodemailer');
const configParams = require('./../config');

exports.passResetMail = async (email, otp) => {
	let mailTransporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: configParams.username,
			pass: configParams.password,
		},
	});

	let mailDetails = {
		from: configParams.fromemail,
		to: email,
		subject: 'OTP to reset password',
		html:
            '<h1>OTP to reset password to your Data Labelling app account is </h1><br><p>OTP:</p><h3>' +
            otp +
            '</h3>',
	};

	return mailTransporter.sendMail(mailDetails);
};
