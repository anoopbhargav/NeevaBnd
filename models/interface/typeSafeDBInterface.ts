export interface typeSafeDBInterface {
    dbUser: string;
    dbPassword: string;
    dbHost: string;
    dbPort: string;
    dbName: string;
    string: string;
    one: Function;
    many: Function;
    any: Function;
    none: Function;
}
