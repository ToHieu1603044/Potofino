import { UserAggregate } from "../aggregates/user.aggregate";

export interface IUserRepository {
  findById(id: string): Promise<UserAggregate | null>;
  findByEmail(email: string): Promise<UserAggregate | null>;
  save(user: UserAggregate): Promise<UserAggregate>;
  exists(id: string): Promise<boolean>;
  findByRefreshToken(token: string): Promise<UserAggregate | null>;
}