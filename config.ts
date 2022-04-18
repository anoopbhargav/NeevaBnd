require('dotenv').config();

module.exports = {
	//set to false to use local postgresql instance
	useRedShift: true,
	//for local postgresql
	pgsql_dbName: 'postgres',
	pgsql_dbUser: 'postgres',
	pgsql_dbPassword: 'admin',
	pgsql_dbPort: '5432',
	pgsql_serverAddress: 'localhost',

	//for redshift
	redshift_dbName: process.env.REDSHIFT_DBNAME as string,
	redshift_dbuser: process.env.REDSHIFT_USER as string,
	redshift_dbPassword: process.env.REDSHIFT_PASSWORD as string,
	redshift_dbHost: process.env.REDSHIFT_HOST as string,
	redshift_dbPort: '5439',

	//S3 details
	s3region: 'us-east-1',

	//gmail details
	username: 'neevadev@gmail.com',
	password: 'neeva123456',
	fromemail: 'neevadev@gmail.com',
};
