// billingKafkaConsumer.js

// const ip = require('ip');
const billingModel = require('../models/billingModel');

const kafkaHost = process.env.KAFKA_HOST // || ip.address();

// kafka initialization
const topicUserReg = 'auth.user_registered';
const topicOrderStatusChanged = 'order.order_changed';
topicPaymentResult = 'billing.payment_result';

const { Kafka, logLevel } = require('kafkajs');

const kafka = new Kafka({
    logLevel: logLevel.ERROR,
    brokers: [`${kafkaHost}:9092`],
    clientId: 'billing-app',
});

const kafkaProducer = kafka.producer({
    allowAutoTopicCreation: true
});

const connectProducerToKafka = async () => {
    await kafkaProducer.connect();
}



groupRnd = (Math.random() + 1).toString(36).substring(7);
const consumer = kafka.consumer({ 
    groupId: 'billing_',// + groupRnd, 
    allowAutoTopicCreation: true
});

// consumer for user.registered event
const runKafkaConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topics: [topicUserReg, topicOrderStatusChanged], fromBeginning: false});
        
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const prefix = `${topic}[${partition} | ${message.offset}]`;
            console.log(`[event received]: ${prefix} ${message.value}`);

            if (topic === topicUserReg) {
                userRegistrationHandler(message);
            } else if (topic === topicOrderStatusChanged) {
                orderStatusChangedHandler(message);
            }

        }
    });
};

// send event for order status changed
var sendEventPaymentStatus = async function (orderId, status, timestamp, info, orderNumber, userId, amount) {

    try {
        await kafkaProducer.send({
            topic: topicPaymentResult,
            messages: [
                {
                    key: orderId,
                    value: JSON.stringify({
                        orderId: orderId,
                        status: status,
                        timestamp: timestamp,
                        orderNumber: orderNumber,
                        info: info,
                        userId: userId,
                        amount: amount
                    })
                }
            ]
        });

        console.log(`[kafka producer]. Payment status sent for order ${orderNumber} ('${orderId}'): '${status}'`);
    }
    catch (e) {
        console.error(`[kafka producer] ${e.message}`, e);
    }
};

// create wallet for new user
var userRegistrationHandler = async function (message) {

    const userId = JSON.parse(message.value).id;

    billingModel.createWallet(userId, (err, result) => {
        if (err) {
            console.error("ERROR: [create wallet]", err);
        }
        else {
            console.log(`[wallet created]: Wallet created for user '${userId}'`);
        }
    });
}

var orderStatusChangedHandler = async function (message) {
    console.log(`[order status change handler]: ${message.value}`);
    const msg = JSON.parse(message.value);

    if (msg.status === 'CREATED') {
        billingModel.payForOrder(msg.userId, parseFloat(msg.sum), msg.orderId, msg.orderNumber, (err, result) => {
            

            if (err) {
                console.log(`[order payment]: ERROR. Order '${msg.orderNumber}' (${msg.orderId}) error: ${err}`);
                
                sendEventPaymentStatus(msg.orderId, 'ERROR', new Date(), err.message, msg.orderNumber, msg.userId, msg.sum);
            }
            else {
                console.log(`[order payment]: Order '${msg.orderNumber}' (${msg.orderId}) payment result: ${result}`);

                
                if (result === 'SUCCESS') {
                    sendEventPaymentStatus(msg.orderId, 'SUCCESS', new Date(), 'Payed successfully', msg.orderNumber, msg.userId, msg.sum);
                } else if (result === 'NOT_ENOUGH_BALANCE') {
                    sendEventPaymentStatus(msg.orderId, 'ERROR', new Date(), 'NOT_ENOUGH_BALANCE', msg.orderNumber, msg.userId, msg.sum);
                } else if (result === 'ALREADY_PAID') {
                    sendEventPaymentStatus(msg.orderId, 'ALREADY_PAID', new Date(), 'ALREADY_PAID', msg.orderNumber, msg.userId, msg.sum);
                }
            }
        });
    }
}



// run the consumer
runKafkaConsumer().catch(e => console.error(`ERROR: [billing consumer] ${e.message}`, e));

// connect producer to kafka
connectProducerToKafka().catch(e => console.error(`ERROR: [kafka producer] ${e.message}`, e))


// handle process termination
const errorTypes = ['unhandledRejection', 'uncaughtException'];
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

// errorTypes.forEach(type => {
//     process.on(type, async () => {
//         try {
//             console.log(`process.on ${type}`);
//             await kafkaProducer.disconnect();
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
            await kafkaProducer.disconnect();
            await consumer.disconnect();
        } finally {
            process.kill(process.pid, type);
        }
    });
});
