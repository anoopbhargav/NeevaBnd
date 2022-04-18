const express = require('express');
var app = express();
const router = express.Router();
var jwt = require('jsonwebtoken');
require('dotenv').config();

var multer = require('multer');
var upload = multer({ dest: 'uploads/' });

//====================Controllers=====================//
const userController = require('../controllers/userController');
const importController = require('../controllers/importController');
const studyController = require('../controllers/studyController');
const updateController = require('../controllers/updateController');
const reportController = require('../controllers/reportController');
const { passport, session } = require('./googleOAuth');   

router.use(async (req, res, next) => {
	// check header or url parameters or post parametrs for token
	var token = req.body.token || req.params.token || req.headers['token'];
	var uid = req.body.uid || req.params.uid || req.headers['uid'];

	if (req.baseUrl.includes('signin') || req.url.includes('signin')) {
		console.log('signin');
		next();
	} else {
		console.log('not signin');
		// decode token
		if (token) {
			console.log('inside token');
			// verifies secret and checks exp
			try {
				const decoded = await jwt.verify(token, process.env.JWT_SECRET);
				if (uid) {
					console.log('inside uid');
					const savedToken = await userController.getTokenById(uid);
					if (savedToken) {
						if (String(token) === String(savedToken.token)) {
							req.decoded = decoded;
							console.log('token matched');
							next();
						} else {
							console.log('token did not match');
							return res.status(401).send({
								status_code: 401,
								success: false,
								message: 'token and uid does not match',
							});
						}
					} else {
						return res.status(401).send({
							status_code: 401,
							success: false,
							message: 'No token is given for this user',
						});
					}
				} else {
					// if there is no uid
					// return an error
					return res.status(401).send({
						status_code: 401,
						success: false,
						message: 'No uid provided.',
					});
				}
			} catch (error) {
				console.log('erre', error);
				return res.status(401).json({
					status_code: 401,
					success: false,
					message: JSON.stringify(error),
				});
			}
		} else {
			// if there is no token
			// return an error
			return res.status(401).send({
				status_code: 401,
				success: false,
				message: 'No token provided.',
			});
		}
	}
});

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: true,
	})
);

app.use(passport.initialize());
app.use(passport.session());

//========================API endpoints=================================//

//=========================User Endpoints==============//
app.use('/user/addUser', router, userController.addUser);
app.use('/user/getAllUsers', router, userController.getAllUsers);
app.use('/user/deleteUser', router, userController.deleteUser);
app.use('/user/editUser', router, userController.editUser);
app.use('/user/signin', router, userController.signin);
app.use('/user/passwordResetMail', router, userController.sendPassResetMail);
app.use('/user/resetPassword', router, userController.resetPassword);
app.use('/user/updatePassword', router, userController.updateUserPassword);
app.post(
	'/user/googleoauthverification',
	passport.authenticate('google-token', { session: false }),
	userController.googleAuth
);

//=======================Import endpoints===============//
app.post(
	'/import/import-queryset-aws',
	router,
	importController.importQuerySetS3
);
app.post(
	'/import/import-queryset',
	router,
	upload.single('queryfile'),
	importController.importQuerySets
);

//=======================Report endpoints===============//
app.post('/report/get-queryset-tags', router, reportController.getQuerysetTags);
app.post(
	'/report/get-querysets-by-tags',
	router,
	reportController.getQuerysetsByTags
);
app.post('/report/generate-report', router, reportController.generateReport);
app.post('/report/save-report', router, reportController.saveReport);
app.get('/report/get-report/:reportid', router, reportController.getReport);
app.post('/report/get-saved-reports', router, reportController.getSavedReports);
app.post('/report/delete-report', router, reportController.deleteReport);
app.post(
	'/report/compare-querysets',
	router,
	reportController.compareQuerysets
);

//=======================Study endpoints===============//
app.post('/study/get-queries', router, studyController.getQueries);
app.post('/study/get-querysets', router, studyController.getQuerysets);
app.post('/study/get-queryresults', router, studyController.getQueryresults);
app.post(
	'/study/single-side-result-details',
	router,
	studyController.singleSideResults
);
app.post(
	'/study/get-side-by-side-queryresults',
	router,
	studyController.getsideBySideQueryResults
);
app.post(
	'/study/side-by-side-result-details',
	router,
	studyController.sideBySideResults
);
app.post('/study/add-notes', router, studyController.addNotes);
app.post('/study/get-all-notes', router, studyController.getAllNotes);

//=======================Update endpoints==============//
app.post('/update/exclude-query', router, updateController.excludeQuery);
app.post(
	'/update/singleside-results-with-ratings',
	router,
	updateController.singleSideResultsWithRatings
);
app.post(
	'/update/update-single-side-result-rating',
	router,
	updateController.updateRating
);
app.post(
	'/update/update-side-by-side-result-rating',
	router,
	updateController.updateSideBySideRating
);
app.post('/update/delete-queryset', router, updateController.deleteQueryset);
app.post(
	'/update/update-queryset-metric',
	router,
	updateController.updateQuerysetMetric
);

module.exports = app;
