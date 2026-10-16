import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class InstrumentsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(activeOnly = true) {
    const sql = activeOnly
      ? `SELECT * FROM instruments WHERE is_active = TRUE ORDER BY sort_order`
      : `SELECT * FROM instruments ORDER BY sort_order`;
    return this.db.query(sql);
  }

  async findById(id: string) {
    const rows = await this.db.query(
      `SELECT * FROM instruments WHERE id = $1`, [id],
    );
    return rows[0] ?? null;
  }

  async findBySymbol(symbol: string) {
    const rows = await this.db.query(
      `SELECT * FROM instruments WHERE symbol = $1 AND is_active = TRUE`, [symbol],
    );
    return rows[0] ?? null;
  }
}
