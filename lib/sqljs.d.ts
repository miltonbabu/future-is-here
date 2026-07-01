declare module "sql.js" {
  interface Database {
    run(sql: string, params?: unknown[]): void;
    get(sql: string, params?: unknown[]): Record<string, unknown> | undefined;
    all(sql: string, params?: unknown[]): Record<string, unknown>[];
  }

  interface InitOptions {
    locateFile: (file: string) => string;
  }

  function initSqlJs(options: InitOptions): Promise<{
    Database: new () => Database;
  }>;

  export default initSqlJs;
}
