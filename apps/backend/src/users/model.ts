import { schemas, type Database } from "@/common/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { UserDto } from "./dtos";
import type { DbUser } from "@/common/db/schemas";

export type UserProps = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  pictureUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
  hashedPassword: string;
};

export type CreateUserProps = Omit<UserProps, "id" | "createdAt" | "updatedAt">;
export type UpdateUserProps = Partial<
  Omit<UserProps, "id" | "createdAt" | "updatedAt" | "hashedPassword">
>;

export class User {
  private static db: Database;

  public static setDb(db: Database) {
    User.db = db;
  }

  private props: UserProps;

  constructor(props: UserProps) {
    this.props = props;
  }

  get id() {
    return this.props.id;
  }

  get username() {
    return this.props.username;
  }

  get firstName() {
    return this.props.firstName;
  }

  get lastName() {
    return this.props.lastName;
  }

  get fullName() {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get pictureUrl() {
    return this.props.pictureUrl;
  }

  get hashedPassword() {
    return this.props.hashedPassword;
  }

  static create(props: CreateUserProps): User {
    return new User({
      ...props,
      id: randomUUID(),
      createdAt: new Date(),
    });
  }

  static async findMany(): Promise<User[]> {
    const users = await User.db.client.select().from(schemas.usersTable);

    return users.map(User.fromDb);
  }

  static async findById(id: string): Promise<User | null> {
    const [user] = await User.db.client
      .select()
      .from(schemas.usersTable)
      .where(eq(schemas.usersTable.id, id));

    return user ? User.fromDb(user) : null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const [user] = await User.db.client
      .select()
      .from(schemas.usersTable)
      .where(eq(schemas.usersTable.username, username));

    return user ? User.fromDb(user) : null;
  }

  static async deleteById(id: string): Promise<boolean> {
    const { rows } = await User.db.client
      .delete(schemas.usersTable)
      .where(eq(schemas.usersTable.id, id));

    return rows.length > 0;
  }

  static toDto(model: User): UserDto {
    return {
      id: model.id,
      username: model.username,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt?.toISOString(),
      firstName: model.firstName,
      lastName: model.lastName,
      fullName: `${model.fullName}`,
      pictureUrl: model.pictureUrl,
    };
  }

  static fromDb(row: DbUser): User {
    return new User({
      id: row.id,
      createdAt: row.createdAt,
      username: row.username,
      firstName: row.firstName ?? undefined,
      lastName: row.lastName ?? undefined,
      pictureUrl: row.pictureUrl ?? undefined,
      updatedAt: row.updatedAt ?? undefined,
      hashedPassword: row.hashedPassword,
    });
  }

  async save(): Promise<void> {
    await User.db.client
      .insert(schemas.usersTable)
      .values(this.props)
      .onConflictDoUpdate({
        target: schemas.usersTable.id,
        set: {
          firstName: this.props.firstName,
          lastName: this.props.lastName,
          pictureUrl: this.props.pictureUrl,
          username: this.props.username,
          updatedAt: new Date(),
        },
      });
  }

  update(props: UpdateUserProps) {
    this.props = { ...this.props, ...props };
  }
}
