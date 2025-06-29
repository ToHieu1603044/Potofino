
import * as bcrypt from 'bcryptjs';

export class Password {
  private constructor(
    private readonly hashedPassword: string,
    private readonly plainPassword?: string,
  ) { }

  static async create(plainPassword: string): Promise<Password> {
    if (!plainPassword || plainPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const hash = await bcrypt.hash(plainPassword, 10);
    return new Password(hash, plainPassword);
  }
  static fromHashed(hashed: string): Password {
    return new Password(hashed);
  }

  async compare(inputPassword: string): Promise<boolean> {
    return bcrypt.compare(inputPassword, this.hashedPassword);
  }

  getHashed(): string {
    return this.hashedPassword;
  }

  getPlain(): string | undefined {
    return this.plainPassword;
  }
}
