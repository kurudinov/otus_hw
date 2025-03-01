// erpKafkaHandler.js

const erpModel = require('../models/erpModel');

const kafkaHost = process.env.KAFKA_HOST // || ip.address();

// kafka initialization
const topicReservationRequest = 'erp.reservation.request';
const topicReservationResult = 'erp.reservation.result';
const topicReservationCancel = 'erp.reservation.cancel';

const { Kafka, logLevel } = require('kafkajs');

const kafka = new Kafka({
    logLevel: logLevel.ERROR,
    brokers: [`${kafkaHost}:9092`],
    clientId: 'erp-app',
});

const kafkaProducer = kafka.producer({
    allowAutoTopicCreation: true
});

const connectProducerToKafka = async () => {
    await kafkaProducer.connect();
}



groupRnd = (Math.random() + 1).toString(36).substring(7);
const consumer = kafka.consumer({ 
    groupId: 'erp', // + groupRnd, 
    allowAutoTopicCreation: true
});

// consumer
const runKafkaConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topics: [topicReservationRequest, topicReservationCancel], fromBeginning: false});
        
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const prefix = `${topic}[${partition}|${message.offset}]`;
            console.log(`\x1b[32m[event received]: ${prefix} ${message.value}\x1b[0m`);

            if (topic === topicReservationRequest) {
                handleEventReservationRequest(message);
            } else if (topic === topicReservationCancel) {
                handleEventReservationCancel(message);
            }

        }
    });
};

// create reservation (emulation)
var handleEventReservationRequest = async function (message) {
    const msg = JSON.parse(message.value.toString());
    try {

        // считаем, что наличие на складе достоверное, не дожидаемся физической комплектации заказа

        const result = await erpModel.createReservation(msg.orderNumber, msg.productCode, msg.quantity);
        if (result === 'SUCCESS') {
            await sendEventReservationResult(msg.orderNumber, 'SUCCESS', '');
        } else {
            await sendEventReservationResult(msg.orderNumber, 'ERROR', result);
        }
    } catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [handleEventReservationRequest] ${e.message}`, e);
    }
    
}

// create reservation (emulation)
var handleEventReservationCancel = async function (message) {
    const msg = JSON.parse(message.value.toString());
    try {

        // Считаем, что наличие на складе всегда соответствует системе. 
        // Не дожидаемся физической комплектации заказа.

        await erpModel.cancelReservation(msg.orderNumber);

        console.log(`[handleEventReservationCancel]. Done for ${msg.orderNumber}`);

        
    } catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [cancelReservation consumer]. ${e.message}`, e);
    }
    
}

// send event for order status changed
var sendEventReservationResult = async function (orderNumber, result, info) {

    try {

        const val = JSON.stringify({
            orderNumber: orderNumber,
            result: result,
            info: info 
        });

        await kafkaProducer.send({
            topic: topicReservationResult,
            messages: [
                {
                    key: orderNumber.toString(),
                    value: val
                }
            ]
        });

        console.log(`\x1b[36mMessage sent: '${topicReservationResult}' ${val}\x1b[0m`);
    }
    catch (e) {
        console.error(`[sendEventReservationResult] ${e.message}`, e);
    }
};


// run the consumer
runKafkaConsumer().catch(e => console.error(`\x1b[31mERROR:\x1b[0m [billing consumer] ${e.message}`, e));

// connect producer to kafka
connectProducerToKafka().catch(e => console.error(`\x1b[31mERROR:\x1b[0m [kafka producer] ${e.message}`, e))


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
