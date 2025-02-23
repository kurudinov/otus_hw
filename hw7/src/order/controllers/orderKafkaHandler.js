// orderKafkaProducer.js

//const ip = require('ip');
const orderModel = require('../models/orderModel');

const kafkaHost = process.env.KAFKA_HOST // || ip.address();

// kafka initialization
const topicOrderStatus = 'order.order_changed';
const topicPaymentResult = 'billing.payment_result';
const { Kafka, logLevel } = require('kafkajs');
const kafka = new Kafka({
    logLevel: logLevel.WARN,
    brokers: [`${kafkaHost}:9092`],
    clientId: 'order-app',
});
const producer = kafka.producer({
    allowAutoTopicCreation: true
});

const connectProducer = async () => {
    await producer.connect();
}

groupRnd = (Math.random() + 1).toString(36).substring(7);
const consumer = kafka.consumer({ 
    groupId: 'order_',// + groupRnd, 
    allowAutoTopicCreation: true
});


// consumer for payment results event
const runKafkaConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({
        topics: [topicPaymentResult],
        fromBeginning: false
    });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const prefix = `${topic}[${partition} | ${message.offset}]`;
            console.log(`[event received]: ${prefix} ${message.value}`);

            paymentResultHandler(message);
        }
    });
};


var send2 = async function (orderId, orderNumber, status, userId, sum) {

    try {
        await producer.send({
            topic: topicOrderStatus,
            messages: [
                {
                    key: orderId,
                    value: JSON.stringify({
                        orderId: orderId,
                        orderNumber: orderNumber,
                        status: status,
                        userId: userId,
                        sum: sum
                    })
                }
            ]
        });

        console.log(`[send2]. Message sent for order ${orderNumber} ('${orderId}') with status '${status}'`);
    }
    catch (e) {
        console.error(`[send2] ${e.message}`, e);
    }
};

exports.sendEventOrderStatusChanged = async function (orderId, orderNumber, status, userId, sum) {

    try {
        await producer.send({
            topic: topicOrderStatus,
            messages: [
                {
                    key: orderId,
                    value: JSON.stringify({
                        orderId: orderId,
                        orderNumber: orderNumber,
                        status: status,
                        userId: userId,
                        sum: sum
                    })
                }
            ]
        });

        console.log(`[sendEventOrderStatusChanged]. Message sent for order ${orderNumber} ('${orderId}') with status '${status}'`);
    }
    catch (e) {
        console.error(`[sendEventOrderStatusChanged] ${e.message}`, e);
    }
};

var paymentResultHandler = async function (message) {
    const paymentResult = JSON.parse(message.value.toString());

    console.log(`[paymentResultHandler]. Payment result received for order ${paymentResult.orderNumber} ('${paymentResult.orderId}') with status '${paymentResult.status}'`);

    try{
        if (paymentResult.status === 'SUCCESS') {
            const result = await orderModel.updateOrderStatus(paymentResult.orderId, 'PAYED');
            const orderRow = result.rows[0];

            send2(orderRow.Id, orderRow.Number, orderRow.Status, orderRow.UserId, orderRow.Sum);

        } else if (paymentResult.status === 'ERROR') {
            const result = await orderModel.updateOrderStatus(paymentResult.orderId, 'PAY_FAILURE');
            const orderRow = result.rows[0];

            send2(orderRow.Id, orderRow.Number, orderRow.Status, orderRow.UserId, orderRow.Sum);

        } else {
            console.log(`[paymentResultHandler] Unknown status '${paymentResult.status}' for order ${paymentResult.orderNumber} ('${paymentResult.orderId}')`);
        }

    } catch (e) {
        console.error(`[paymentResultHandler] ${e.message}`, e);
    }
    
};



// connect the producer
connectProducer().catch(e => console.error(`ERROR: [order kafka producer] ${e.message}`, e))

// run the consumer
runKafkaConsumer().catch(e => console.error(`ERROR: [order kafka consumer] ${e.message}`, e));


// handle termination signals
const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

errorTypes.forEach(type => {
    process.on(type, async () => {
        try {
            console.log(`process.on ${type}`)
            await producer.disconnect();
            process.exit(0);
        } catch (_) {
            process.exit(1);
        }
    })
})

signalTraps.forEach(type => {
    process.once(type, async () => {
        try {
            await producer.disconnect()
        } finally {
            process.kill(process.pid, type)
        }
    })
});

