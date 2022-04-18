import { commonReqResInterface } from './models/interface/commonReqResInterface';

const express = require('express');
const path = require('path');
// const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const app = express();

require('dotenv').config({path:'./variables.env'});

const promBundle = require('express-prom-bundle');
const metricsMiddleware = promBundle({ includeMethod: true });

app.use(metricsMiddleware);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(cors());

app.use(
	'/healthcheck',
	require('express-healthcheck')({
		healthy: function () {
			return { everything: 'is ok' };
		},
	})
);

app.use(express.static(path.join(__dirname, 'build')));

const routes = require('./routes/routes.js');
app.use('/', routes);

app.get('/', function (req: commonReqResInterface, res: commonReqResInterface) {
	res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const debug = require('debug')('test:server');
const http = require('http');

const port = normalizePort(process.env.PORT || '5000');
app.set('port', port);

const server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
	const port = parseInt(val, 10);

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}

function onError(error: commonReqResInterface) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
	case 'EACCES':
		console.error(bind + ' requires elevated privileges');
		process.exit(1);
		break;
	case 'EADDRINUSE':
		console.error(bind + ' is already in use');
		process.exit(1);
		break;
	default:
		throw error;
	}
}

function onListening() {
	const addr = server.address();
	const bind =
        typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
	debug('Listening on ' + bind);
	console.log(`App is running at http://localhost:${port}`);
}

module.exports = app;
