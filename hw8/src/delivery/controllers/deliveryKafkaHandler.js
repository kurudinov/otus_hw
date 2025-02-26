// deliveryKafkaHandler.js

//const deliveryModel = require('../models/deliveryModel');

const kafkaHost = process.env.KAFKA_HOST // || ip.address();

// kafka initialization
const topicDeliveryRequest = 'delivery.booking.request';
const topicDeliveryResult = 'delivery.booking.result';

const { Kafka, logLevel } = require('kafkajs');

const kafka = new Kafka({
    logLevel: logLevel.ERROR,
    brokers: [`${kafkaHost}:9092`],
    clientId: 'delivery-app',
});

const kafkaProducer = kafka.producer({
    allowAutoTopicCreation: true
});

const connectProducerToKafka = async () => {
    await kafkaProducer.connect();
}



groupRnd = (Math.random() + 1).toString(36).substring(7);
const consumer = kafka.consumer({ 
    groupId: 'delivery_' + groupRnd, 
    allowAutoTopicCreation: true
});

// consumer
const runKafkaConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topics: [topicDeliveryRequest], fromBeginning: false});
        
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const prefix = `${topic}[${partition}|${message.offset}]`;
            console.log(`\x1b[32m[event received]: ${prefix} ${message.value}\x1b[0m`);

            await confirmDeliveryBooking(message);

        }
    });
};



// create delivery based on date
var confirmDeliveryBooking = async function (message) {
    const msg = JSON.parse(message.value.toString());
    try {

        // простая логика: если до даты доставки больше суток, то подтверждаем

        const diffTime = new Date(msg.deliveryDate) - new Date();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 

        let isConfirmed = diffDays > 1;

        console.log(`[confirmDeliveryBooking] Confirmation for order '${msg.orderNumber}': ${isConfirmed}`);

        if (isConfirmed) {
            sendEventDeliveryConfirmation(msg.orderNumber, true, msg.address, msg.deliveryDate, '10:00', '18:00');
        } else {
            sendEventDeliveryConfirmation(msg.orderNumber, false, msg.address, msg.deliveryDate, '00:00', '00:00');
        }
    } catch (e) {
        console.error(`[confirmDeliveryBooking] ${e.message}`, e);
    }
    
}

// send event for order status changed
var sendEventDeliveryConfirmation = async function (orderNumber, isConfirmed, address, deliveryDate, timeFrom, timeTo) {

    try {

        const val = JSON.stringify({
            orderNumber: orderNumber,
            isConfirmed: isConfirmed,
            address: address,
            deliveryDate: deliveryDate,
            timeFrom: timeFrom,
            timeTo: timeTo
        });

        await kafkaProducer.send({
            topic: topicDeliveryResult,
            messages: [
                {
                    key: orderNumber.toString(),
                    value: val
                }
            ]
        });

        console.log(`\x1b[36mMessage sent: '${topicDeliveryResult}' ${val}\x1b[0m`);
    }
    catch (e) {
        console.error(`[sendEventReservationResult] ${e.message}`, e);
    }
};


// run the consumer
runKafkaConsumer().catch(e => console.error(`\x1b[31mERROR:\x1b[0m [kafka consumer] ${e.message}`, e));

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
