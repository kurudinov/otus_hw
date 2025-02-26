// billingKafkaConsumer.js

// const ip = require('ip');
const billingModel = require('../models/billingModel');

const kafkaHost = process.env.KAFKA_HOST // || ip.address();

// kafka initialization
const topicUserReg = 'auth.user.registered';
const topicPaymentRequest = 'billing.payment.request';
const topicPaymentResult = 'billing.payment.result';
const topicReturnRequest = 'billing.return.request';
const topicReturnResult = 'billing.return.result';

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
    groupId: 'billing_' + groupRnd, 
    allowAutoTopicCreation: true
});

// consumer for user.registered event
const runKafkaConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topics: [topicUserReg, topicPaymentRequest, topicReturnRequest], fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const prefix = `${topic}[${partition}|${message.offset}]`;
            console.log(`\x1b[32m[event received]: ${prefix} ${message.value}\x1b[0m`);

            if (topic === topicUserReg) {
                userRegistrationHandler(message);
            } else if (topic === topicPaymentRequest) {
                handleEventPaymentRequest(message);
            } else if (topic === topicReturnRequest) {
                handleEventMoneyReturnRequest(message);
            }

        }
    });
};

// // отправить результат платежа
var sendEventPaymentResult = async function (orderNumber, result, info, userId, amount) {

    try {
        const val = JSON.stringify({
            orderNumber: orderNumber,
            result: result,
            info: info,
            userId: userId,
            amount: amount
        });

        await kafkaProducer.send({
            topic: topicPaymentResult,
            messages: [
                {
                    key: orderNumber.toString(),
                    value: val
                }
            ]
        });

        console.log(`\x1b[36mMessage sent: '${topicPaymentResult}' ${val}\x1b[0m`);
    }
    catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [kafka producer] ${e.message}`, e);
    }
};

// отправить результат возврата
var sendEventMoneyReturnResult = async function (orderNumber, result, info, userId, amount) {

    try {

        const val = JSON.stringify({
            orderNumber: orderNumber,
            result: result,
            info: info,
            userId: userId,
            amount: amount
        });

        await kafkaProducer.send({
            topic: topicReturnResult,
            messages: [
                {
                    key: orderNumber.toString(),
                    value: val
                }
            ]
        });

        console.log(`\x1b[36mMessage sent: '${topicReturnResult}' ${val}\x1b[0m`);
    }
    catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [kafka producer] ${e.message}`, e);
    }
};

// создать счет для нового пользователя
var userRegistrationHandler = async function (message) {

    const userId = JSON.parse(message.value).id;

    billingModel.createWallet(userId, (err, result) => {
        if (err) {
            console.error("\x1b[31mERROR:\x1b[0m [create wallet]", err);
        }
        else {
            console.log(`[wallet created] Wallet created for user '${userId}'`);
        }
    });
}

// обработка платежа
var handleEventPaymentRequest = async function (message) {
    const msg = JSON.parse(message.value);


    billingModel.payForOrder(msg.userId, parseFloat(msg.sum), msg.orderNumber, (err, result) => {
        if (err) {
            console.log(`[handleEventPaymentRequest]: ERROR. Order '${msg.orderNumber}' error: ${err}`);

            sendEventPaymentResult(msg.orderNumber, 'ERROR', err.message, msg.userId, msg.sum);
        }
        else {
            console.log(`[handleEventPaymentRequest]: Order '${msg.orderNumber}' payment result: ${result}`);


            if (result === 'SUCCESS') {
                sendEventPaymentResult(msg.orderNumber, 'SUCCESS', 'Payed successfully', msg.userId, msg.sum);
            } else if (result === 'NOT_ENOUGH_BALANCE') {
                sendEventPaymentResult(msg.orderNumber, 'ERROR', 'NOT_ENOUGH_BALANCE', msg.userId, msg.sum);
            } else if (result === 'ALREADY_PAID') {
                sendEventPaymentResult(msg.orderNumber, 'ALREADY_PAID', 'ALREADY_PAID', msg.userId, msg.sum);
            }
        }
    });

};

var handleEventMoneyReturnRequest = async function (message) {
    const msg = JSON.parse(message.value);


    billingModel.returnMoneyForOrder(msg.userId, parseFloat(msg.sum), msg.orderNumber, (err, result) => {
        if (err) {
            console.log(`[handleEventMoneyReturnRequest]: ERROR. Order '${msg.orderNumber}' error: ${err}`);

            sendEventMoneyReturnResult(msg.orderNumber, 'ERROR', err.message, msg.userId, msg.sum);
        }
        else {
            console.log(`[handleEventMoneyReturnRequest]: Order '${msg.orderNumber}' payment result: ${result}`);

            if (result === 'SUCCESS') {
                sendEventMoneyReturnResult(msg.orderNumber, 'SUCCESS', 'Money return successfully', msg.userId, msg.sum);
            } else if (result === 'ORDER_NOT_PAIED') {
                sendEventMoneyReturnResult(msg.orderNumber, 'SUCCESS', 'Money return not needed', msg.userId, msg.sum);
            }
        }
    });

}



// run the consumer
runKafkaConsumer().catch(e => console.error(`\x1b[31mERROR:\x1b[0m [billing consumer] ${e.message}`, e));

// connect producer to kafka
connectProducerToKafka().catch(e => console.error(`\x1b[31mERROR:\x1b[0m [billing kafka producer] ${e.message}`, e))


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
