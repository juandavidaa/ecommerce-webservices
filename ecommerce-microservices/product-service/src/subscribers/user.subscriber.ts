// src/subscribers/user.subscriber.ts
import { getRabbitMQChannel } from '../utils/rabbitmq.utils';
// import { ApiError } from '../utils/apiError.utils'; // Or your error handling utility
// ApiError is not strictly needed here unless we throw it, logging is fine for now.

const USER_EVENTS_EXCHANGE = 'user_events';
const USER_REGISTERED_QUEUE = 'product_service_user_registered_queue';
const USER_REGISTERED_ROUTING_KEY = 'user.registered';

export const setupUserSubscribers = async () => {
  try {
    const channel = await getRabbitMQChannel();
    if (!channel) {
        console.warn('RabbitMQ channel not available in Product Service. Skipping subscriber setup for user events.');
        return;
    }

    console.log('Setting up RabbitMQ subscribers for user events in Product Service...');

    // Assert the exchange (publisher might also assert it, but good practice for consumer too)
    await channel.assertExchange(USER_EVENTS_EXCHANGE, 'direct', { durable: true });
    
    // Assert the queue
    const q = await channel.assertQueue(USER_REGISTERED_QUEUE, { durable: true });
    
    // Bind the queue to the exchange with the routing key
    await channel.bindQueue(q.queue, USER_EVENTS_EXCHANGE, USER_REGISTERED_ROUTING_KEY);

    console.log(`[*] Product Service: Waiting for messages in queue '${q.queue}' for routing key '${USER_REGISTERED_ROUTING_KEY}'. To exit press CTRL+C`);

    channel.consume(q.queue, (msg) => {
      if (msg !== null) {
        try {
          const messageContent = JSON.parse(msg.content.toString());
          console.log(`[Product Service] Received user.registered event:`, messageContent);
          
          // TODO: Implement any logic needed in Product Service when a user registers
          // For example:
          // if (messageContent.userId && messageContent.email) {
          //   console.log(`Processing user registration for ${messageContent.email}`);
          //   // Call a service method like: await customerProfileService.createProfile(messageContent);
          // } else {
          //   console.warn('[Product Service] Received malformed user.registered event:', messageContent);
          // }

          channel.ack(msg); // Acknowledge the message
        } catch (error) {
          console.error('[Product Service] Error processing message from RabbitMQ:', error);
          // Consider sending to a dead-letter queue or nack with requeue=false
          // For simplicity, nack without requeue to avoid processing loops for bad messages.
          channel.nack(msg, false, false); 
        }
      }
    }, {
      // noAck: false (default) - ensure messages are acknowledged
    });
  } catch (error) {
    console.error('[Product Service] Error setting up RabbitMQ user event subscribers:', error);
    // Depending on the application's needs, you might want to retry or handle this more gracefully.
    // For now, we just log the error. The service might still run for other functionalities.
    // throw new ApiError(500, 'Failed to setup RabbitMQ subscribers', [error]); // If critical
  }
};
