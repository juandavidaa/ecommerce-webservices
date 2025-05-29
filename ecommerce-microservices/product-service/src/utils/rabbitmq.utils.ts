// src/utils/rabbitmq.utils.ts
import amqp from 'amqplib';
import { ApiError } from './apiError.utils'; // Assuming ApiError is in the same utils folder

const RABBITMQ_URI = process.env.RABBITMQ_URI || 'amqp://localhost:5672'; // Default, will be overridden by Docker Compose env var
let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

export const connectRabbitMQ = async () => {
  try {
    if (channel && connection) {
      return { connection, channel };
    }
    console.log('Attempting to connect to RabbitMQ...');
    connection = await amqp.connect(RABBITMQ_URI);
    channel = await connection.createChannel();
    console.log('RabbitMQ connected successfully.');

    // Example: Assert an exchange (optional, depends on your pattern)
    // await channel.assertExchange('user_events', 'direct', { durable: true });

    connection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err.message);
      // Handle reconnection logic if needed, or let Docker restart the service
      connection = null;
      channel = null;
    });

    connection.on('close', () => {
      console.warn('RabbitMQ connection closed. Attempting to reconnect...');
      // Handle reconnection logic
      connection = null;
      channel = null;
      // setTimeout(connectRabbitMQ, 5000); // Simple retry, consider more robust strategies
    });

    return { connection, channel };
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    // Allow service to start even if RabbitMQ is down initially, it might recover
    // Or throw new ApiError(500, 'Failed to connect to RabbitMQ', [error]); 
    // Depending on how critical MQ is at startup
    return { connection: null, channel: null }; // Allow graceful degradation if MQ is optional at start
  }
};

export const getRabbitMQChannel = async (): Promise<amqp.Channel> => {
  if (!channel) {
    const { channel: newChannel } = await connectRabbitMQ();
    if (!newChannel) {
      throw new ApiError(500, 'RabbitMQ channel is not available.');
    }
    return newChannel;
  }
  return channel;
};

export const publishToExchange = async (exchangeName: string, routingKey: string, message: any): Promise<void> => {
  try {
    const ch = await getRabbitMQChannel();
    // Ensure exchange exists (optional, can be done by consumer or publisher)
    await ch.assertExchange(exchangeName, 'direct', { durable: true });
    
    ch.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(message)), { persistent: true });
    console.log(`Message published to exchange '${exchangeName}' with routing key '${routingKey}':`, message);
  } catch (error) {
    console.error('Error publishing message to RabbitMQ:', error);
    // Handle failed publish (e.g., retry, log to dead-letter-exchange, etc.)
    // For now, we'll just log it.
    // throw error; // Re-throw if publishing is critical
  }
};
