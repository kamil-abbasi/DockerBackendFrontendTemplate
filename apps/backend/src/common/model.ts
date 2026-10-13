import type { Database } from "./db";

export class Model {
  protected static db: Database;

  static setDb(instance: Database) {
    Model.db = instance;
  }
}
