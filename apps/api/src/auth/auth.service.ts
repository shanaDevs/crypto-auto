import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const rows = await this.db.query(
      `SELECT u.*, r.name AS role_name
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1 AND u.is_active = TRUE`,
      [email.toLowerCase()],
    );
    const user = rows[0];
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  login(user: any): { access_token: string } {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role_name,
    };
    return { access_token: this.jwt.sign(payload) };
  }

  async register(email: string, password: string, role = 'analyst'): Promise<{ id: string }> {
    const hash = await bcrypt.hash(password, 12);
    const roleRow = await this.db.query(
      'SELECT id FROM roles WHERE name = $1', [role],
    );
    if (!roleRow[0]) throw new Error(`Unknown role: ${role}`);
    const rows = await this.db.query(
      `INSERT INTO users (email, password_hash, role_id)
       VALUES ($1, $2, $3) RETURNING id`,
      [email.toLowerCase(), hash, roleRow[0].id],
    );
    return { id: rows[0].id };
  }

  async findById(id: string): Promise<any> {
    const rows = await this.db.query(
      `SELECT u.*, r.name AS role_name
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }
}
