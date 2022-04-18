import { typeSafeDBInterface } from './models/interface/typeSafeDBInterface';

const pgpr = require('pg-promise');
const config = require('./config');
const connections: Array<typeSafeDBInterface> = [];

export const getConnection = async (): Promise<typeSafeDBInterface> => {
	if (config.useRedShift) {
		const dbName = config.redshift_dbName;
		if (!connections[dbName]) {
			const dbUser = config.redshift_dbuser;
			const dbPassword = config.redshift_dbPassword;
			const dbHost = config.redshift_dbHost;
			const dbPort = config.redshift_dbPort;

			const dbc = pgpr({ capSQL: true });
			console.log(`Opening connection to: ${dbName}, host is: ${dbHost}`);

			const connectionString = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
			connections[dbName] = dbc(connectionString);
		}
		return connections[dbName];
	} else {
		const dbName = config.pgsql_dbName;
		if (!connections[dbName]) {
			const options = {
				// Initialization Options if any
				capSQL: true,
			};
			const pgp = require('pg-promise')(options);
			const connectionString =
                'postgresql://' +
                config.pgsql_dbUser +
                ':' +
                config.pgsql_dbPassword +
                '@' +
                config.pgsql_serverAddress +
                ':' +
                config.pgsql_dbPort +
                '/' +
                config.pgsql_dbName;
			connections[dbName] = pgp(connectionString);
		}
		return connections[dbName];
	}
};
