export interface PGMQMessage<T = any> {
  msg_id: string;
  read_ct: number;
  enqueued_at: Date;
  last_read_at: Date;
  vt: Date;
  message: T;
  headers: any;
}
