// billingKafkaConsumer.js

const notifModel = require('../models/notifModel');

const kafkaHost = process.env.KAFKA_HOST //|| ip.address();

// kafka initialization
const topicUserReg = 'auth.user.registered';
const topicOrderStatusChanged = 'order.status.changed';
const topicPaymentResult = 'billing.payment.result';

const { Kafka, logLevel } = require('kafkajs');

const kafka = new Kafka({
    logLevel: logLevel.ERROR,
    brokers: [`${kafkaHost}:9092`],
    clientId: 'notif-app',
});

groupRnd = (Math.random() + 1).toString(36).substring(7);
const consumer = kafka.consumer({ 
    groupId: 'notif', // + groupRnd, 
    allowAutoTopicCreation: true,
    // rebalanceTimeout: 5000,
    // sessionTimeout: 6000,
    // heartbeatInterval: 2000 
});

// consumer for user.registered event
const runKafkaConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topics: [topicUserReg, topicOrderStatusChanged, topicPaymentResult], fromBeginning: false});
        
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const prefix = `${topic}[${partition}|${message.offset}]`;
            console.log(`\x1b[32m[event received]: ${prefix} ${message.value}\x1b[0m`);

            const msg = JSON.parse(message.value);

            console.log(`[add notification]. Topic: '${topic}'`);

            try {
                if (topic === topicUserReg) {
                    
                    await notifModel.addNotification(msg.id, 
                        `User ${msg.firstName} ${msg.lastName} (${msg.email}) registered`, 
                        null, 
                        message.timestamp);
                } else if (topic === topicOrderStatusChanged) {
                    await notifModel.addNotification(msg.userId, 
                        `Order #${msg.orderNumber} with sum '${msg.sum}' changed status '${msg.status}'`, 
                        msg.orderNumber,
                        message.timestamp);
                } else if (topic === topicPaymentResult) {
                    await notifModel.addNotification(msg.userId, 
                        `Payment status for order #${msg.orderNumber}, sum '${msg.amount}': '${msg.status}'. Info: ${msg.info}`,
                        null,
                        message.timestamp);
                }
            } catch (e) {
                console.error(`\x1b[31mERROR:\x1b[0m [event processing error]: ${e.message}`, e);
            }
        }
    });
};

// run the consumer
runKafkaConsumer().catch(e => console.error(`\x1b[31mERROR:\x1b[0m [kafka consumer] ${e.message}`, e));

// handle process termination
const errorTypes = ['unhandledRejection', 'uncaughtException'];
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

// errorTypes.forEach(type => {
//     process.on(type, async () => {
//         try {
//             console.log(`process.on ${type}`);
//             await consumer.disconnect();
//             process.exit(0);
//         } catch (_) {
//             process.exit(1);
//         }
//     })
// });

signalTraps.forEach(type => {
    process.once(type, async () => {
        try {
            
            await consumer.disconnect();
        } finally {
            process.kill(process.pid, type);
        }
    });
});
