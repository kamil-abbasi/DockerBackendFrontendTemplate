import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";

export class Database {
  public readonly client: NodePgDatabase;

  constructor(dbUrl: string) {
    this.client = drizzle(dbUrl);
  }
}

export * as schemas from "./schemas";
