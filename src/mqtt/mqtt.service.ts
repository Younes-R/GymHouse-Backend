import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect, MqttClient } from 'mqtt';

type MqttMessageHandler = (topic: string, payload: any) => Promise<void>;

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {}

  private readonly logger = new Logger(MqttService.name);
  private client!: MqttClient;
  private messageHandlers: Map<string, MqttMessageHandler> = new Map();

  onModuleInit() {
    this.client = connect(this.configService.getOrThrow<string>('BROKER_URL'), {
      port: 8883,
      username: this.configService.getOrThrow<string>('MQTT_USERNAME'),
      password: this.configService.getOrThrow<string>('MQTT_PASSWORD'),
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to MQTT broker successfully');

      for (const topic of this.messageHandlers.keys()) {
        this.client.subscribe(topic, { qos: 2 });
      }
    });

    this.client.on('message', async (topic, rawMessage) => {
      this.logger.debug(`Received a msg from topic: ${topic}`);
      try {
        const payload = JSON.parse(rawMessage.toString());

        for (const filter of this.messageHandlers.keys()) {
          if (this.matchesMQTTTopicFilter(filter, topic)) {
            const handler = this.messageHandlers.get(filter);
            if (handler) await handler(topic, payload);
          }
        }
      } catch (err) {
        this.logger.error(`Failed to process message on ${topic}`, err);
      }
    });

    this.client.on('error', (err) => {
      this.logger.error('MQTT Client Error', err);
    });

    this.client.on('end', () => {
      this.logger.log('MQTT client ended connection');
    });
  }

  subscribe(topic: string, handler: MqttMessageHandler) {
    this.messageHandlers.set(topic, handler);
    if (this.client.connected) {
      this.client.subscribe(topic, { qos: 2 });
    }
  }

  publish(topic: string, payload: Record<string, any>, qos: 0 | 1 | 2 = 2) {
    if (!this.client.connected) {
      this.logger.warn(`Cannot publish to ${topic}. MQTT client disconnected`);
      return;
    }

    this.client.publish(topic, JSON.stringify(payload), { qos });
  }

  private matchesMQTTTopicFilter(filter: string, topic: string) {
    const filterLevels = filter.split('/');
    const topicLevels = topic.split('/');

    if (
      !filterLevels.includes('*') &&
      filterLevels.length !== topicLevels.length
    ) {
      return false;
    }

    for (let i = 0; i < filterLevels.length; i++) {
      if (filterLevels[i] == '*') {
        return true;
      } else {
        if (filterLevels[i] !== topicLevels[i] && filterLevels[i] !== '+')
          return false;
      }
    }

    return true;
  }

  onModuleDestroy() {
    this.client.end();
  }
}
