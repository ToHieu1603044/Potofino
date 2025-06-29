import { v4 as uuidv4 } from 'uuid';

export class RefreshTokenEntity {
  public readonly id: string;
  public token: string;
  public userId: string;
  public expiresAt: Date;
  public createdAt: Date;

  private constructor(id: string, token: string, userId: string, expiresAt: Date, createdAt: Date) {
    this.id = id;
    this.token = token;
    this.userId = userId;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
  }

  static create(token: string, userId: string, expiresAt: Date, id?: string): RefreshTokenEntity {
    return new RefreshTokenEntity(id || uuidv4(), token, userId, expiresAt, new Date());
  }

  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}