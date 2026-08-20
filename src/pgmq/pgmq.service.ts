import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { PGMQMessage } from './interfaces/pgmq-message.interface';
import { QueueName } from './enums/queue-name.enum';

@Injectable()
export class PgmqService implements OnModuleDestroy {
  private readonly logger = new Logger(PgmqService.name);
  private readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      options: '-c search_path=pgmq,public',
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('DB connections pool has drained');
  }

  async send<T>(queueName: QueueName, message: T, delay: number = 0) {
    try {
      const res = await this.pool.query(
        `
        SELECT * from pgmq.send(
          queue_name  => $1,
          msg         => $2,
          delay       => $3::integer
        );
        `,
        [queueName, JSON.stringify(message), delay],
      );

      return res.rows[0] as { send: string };
    } catch (err) {
      console.error('Could not send message to PGMQ');
      throw new Error('Could not send message to PGMQ', { cause: err });
    }
  }

  async read<T>(queueName: QueueName, vt: number = 30, qty: number = 1) {
    try {
      const res = await this.pool.query(
        `
        SELECT * FROM pgmq.read(
          queue_name => $1,
          vt         => $2,
          qty        => $3
        );`,
        [queueName, vt, qty],
      );

      return res.rows as Array<PGMQMessage<T>>;
    } catch (err) {
      console.error('Could not read message(s) from PGMQ');
      throw new Error('Could not read message(s) from PGMQ', { cause: err });
    }
  }

  async pop<T>(queueName: QueueName) {
    try {
      const res = await this.pool.query(
        `
        SELECT * FROM pgmq.pop($1);
        `,
        [queueName],
      );

      return res.rows as Array<PGMQMessage<T>>;
    } catch (err) {
      console.error('Could not pop message from PGMQ');
      throw new Error('Could not pop message from PGMQ', { cause: err });
    }
  }

  async archive(queueName: QueueName, messageId: number) {
    try {
      const res = await this.pool.query(
        `
        SELECT pgmq.archive(
          queue_name => $1,
          msg_id     => $2
        );
        `,
        [queueName, messageId],
      );

      return res.rows[0] as { archive: boolean };
    } catch (err) {
      console.error('Could not archive message from PGMQ');
      throw new Error('Could not archive message from PGMQ', { cause: err });
    }
  }

  async archiveMany(queueName: QueueName, messageIds: Array<number>) {
    try {
      const res = await this.pool.query(
        `
        SELECT pgmq.archive(
          queue_name => $1,
          msg_ids     => $2
        );
        `,
        [queueName, messageIds],
      );

      return res.rows as Array<{ archive: boolean }>;
    } catch (err) {
      console.error('Could not archive messages from PGMQ');
      throw new Error('Could not archive messages from PGMQ', { cause: err });
    }
  }

  async sendBatch<T>(queueName: QueueName, messages: Array<T>) {
    try {
      const res = await this.pool.query(
        `
        SELECT pgmq.send_batch(
          queue_name => $1,
          msgs       => $2::jsonb[]
        );
       `,
        [queueName, messages],
      );

      return res.rows as Array<{ send_batch: string }>;
    } catch (err) {
      console.error('Could not send messages to PGMQ');
      throw new Error('Could not send messages to PGMQ', { cause: err });
    }
  }

  async delete(queueName: QueueName, messageId: number) {
    try {
      const res = await this.pool.query(
        `
        SELECT pgmq.delete(
          queue_name => $1,
          msg_id     => $2
        ); 
        `,
        [queueName, messageId],
      );

      return res.rows[0] as { delete: boolean };
    } catch (err) {
      console.error('Could not delete message from PGMQ');
      throw new Error('Could not delete message from PGMQ', { cause: err });
    }
  }
}
