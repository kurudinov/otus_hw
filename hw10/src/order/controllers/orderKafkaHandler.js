// orderKafkaHandler.js

const prometheus = require('prom-client');

// Создание метрик
const metricOrdersExecutionTotal = new prometheus.Counter({
    name: 'my_orders_executed_total',
    help: 'Total number of orders executed',
    labelNames: ['status']
});

const orderModel = require('../models/orderModel');

const kafkaHost = process.env.KAFKA_HOST // || ip.address();

// kafka initialization
const topicOrderStatus = 'order.status.changed';
const topicPaymentResult = 'billing.payment.result';
const topicPaymentRequest = 'billing.payment.request';
const topicReturnRequest = 'billing.return.request';
const topicReturnResult = 'billing.return.result';
const topicReservationRequest = 'erp.reservation.request';
const topicReservationResult = 'erp.reservation.result';
const topicReservationCancel = 'erp.reservation.cancel';
const topicDeliveryRequest = 'delivery.booking.request';
const topicDeliveryResult = 'delivery.booking.result';

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

const that = this;

groupRnd = (Math.random() + 1).toString(36).substring(7);
const consumer = kafka.consumer({ 
    groupId: 'order', // + groupRnd, 
    allowAutoTopicCreation: true
});


// consumer for payment results event
const runKafkaConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({
        topics: [topicPaymentResult, topicReservationResult, topicDeliveryResult, topicReturnResult],
        fromBeginning: false
    });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const prefix = `${topic}[${partition}|${message.offset}]`;
            console.log(`\x1b[32m[event received]: ${prefix} ${message.value}\x1b[0m`);

            if (topic === topicPaymentResult) {
                handleEventPaymentResult(message);
            } else if (topic === topicReservationResult) {
                handleEventReservationResult(message);
            } else if (topic === topicDeliveryResult) {
                handleEventDeliveryBookResult(message);
            } else if (topic === topicReturnResult) {
                handleEventMoneyReturnResult(message);
            } 
            
        }
    });
};

// отправить событие о смене статуса заказа
exports.sendEventOrderStatusChanged = async function (orderNumber) {

    try {

        let orderRow = await orderModel.getOrderDetails(orderNumber);

        const val = JSON.stringify({
            orderNumber: orderNumber,
            status: orderRow.Status,
            userId: orderRow.UserId,
            sum: orderRow.Sum
        });

        await producer.send({
            topic: topicOrderStatus,
            messages: [
                {
                    key: orderNumber.toString(),
                    value: val
                }
            ]
        });

        console.log(`\x1b[36mMessage sent: '${topicOrderStatus}' ${val}\x1b[0m`);
    }
    catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [kafka producer] ${e.message}`, e);
    }
};

// отправить запрос на отплату заказа
exports.sendEventPaymentRequest = async function (orderNumber, userId, sum) {

    try {
        const val = JSON.stringify({
            orderNumber: orderNumber,
            userId: userId,
            sum: sum
        });

        await producer.send({
            topic: topicPaymentRequest,
            messages: [
                {
                    key: orderNumber.toString(),
                    value: val
                }
            ]
        });

        console.log(`\x1b[36mMessage sent: '${topicPaymentRequest}' ${val}\x1b[0m`);
    }
    catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [kafka producer] ${e.message}`, e);
    }
};

// отправить запрос на возврат денег
exports.sendEventMoneyReturnRequest = async function (orderNumber, userId, sum) {

    try {

        let orderRow = await orderModel.getOrderDetails(orderNumber);

        const val = JSON.stringify({
            orderNumber: orderNumber,
            userId: orderRow.UserId,
            sum: orderRow.Sum
        });

        await producer.send({
            topic: topicReturnRequest,
            messages: [
                {
                    key: orderNumber.toString(),
                    value: val
                }
            ]
        });

        console.log(`\x1b[36mMessage sent: '${topicReturnRequest}' ${val}\x1b[0m`);
    }
    catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [kafka producer] ${e.message}`, e);
    }
};

// отправить запрос на резервирование товара на складе
exports.sendEventReservationRequest = async function (orderNumber) {

    try {

        let orderRow = await orderModel.getOrderDetails(orderNumber);

        const val = JSON.stringify({
            orderNumber: orderRow.Number,
            productCode: orderRow.ProductCode,
            quantity: orderRow.Quantity,
            userId: orderRow.UserId
        });

        await producer.send({
            topic: topicReservationRequest,
            messages: [
                {
                    key: orderNumber.toString(),
                    value: val
                }
            ]
        });

        console.log(`\x1b[36mMessage sent: '${topicReservationRequest}' ${val}\x1b[0m`);
    }
    catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [kafka producer] ${e.message}`, e);
    }
};

// отправить запрос на букирование даты доставки
exports.sendEventDeliveryRequest = async function (orderNumber) {

    try {

        let orderRow = await orderModel.getOrderDetails(orderNumber);

        const val = JSON.stringify({
            orderNumber: orderNumber,
            address: orderRow.Address,
            deliveryDate: orderRow.DeliveryDate.toISOString(),
            userId: orderRow.UserId
        });

        await producer.send({
            topic: topicDeliveryRequest,
            messages: [
                {
                    key: orderNumber.toString(),
                    value: val
                }
            ]
        });

        console.log(`\x1b[36mMessage sent: '${topicDeliveryRequest}' ${val}\x1b[0m`);
    }
    catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [kafka producer] ${e.message}`, e);
    }
};

// отправить сообщение в ERP для отмены резерва на складе
exports.sendEventReservationCancel = async function (orderNumber) {

    try {

        let orderRow = await orderModel.getOrderDetails(orderNumber);

        const val = JSON.stringify({
            orderNumber: orderNumber,
            productCode: orderRow.ProductCode,
            quantity: orderRow.Quantity,
            userId: orderRow.UserId
        });

        await producer.send({
            topic: topicReservationCancel,
            messages: [
                {
                    key: orderNumber.toString(),
                    value: val
                }
            ]
        });

        console.log(`\x1b[36mMessage sent: '${topicReservationCancel}' ${val}\x1b[0m`);
    }
    catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [kafka producer] ${e.message}`, e);
    }
};


// обработка события о результате платежа
var handleEventPaymentResult = async function (message) {
    const msg = JSON.parse(message.value.toString());

    try{
        if (msg.result === 'SUCCESS') {
            const result = await orderModel.updateOrderStatus(msg.orderNumber, 'PAYED');
            const orderRow = result.rows[0];

            that.sendEventOrderStatusChanged(orderRow.Number);

            that.sendEventReservationRequest(orderRow.Number);

        } else if (msg.result === 'ERROR') {
            const result = await orderModel.updateOrderStatus(msg.orderNumber, 'PAY_FAILURE');
            const orderRow = result.rows[0];

            that.sendEventOrderStatusChanged(orderRow.Number);

            metricOrdersExecutionTotal.inc({status: "PAY_FAILURE"});

        } else {
            console.log(`[handleEventPaymentResult] Unknown result '${msg.result}' for order ${msg.orderNumber} `);
        }

    } catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [handleEventPaymentResult] ${e.message}`, e);
    }
    
};

// обработка события о результате платежа
var handleEventMoneyReturnResult = async function (message) {
    const msg = JSON.parse(message.value.toString());

    console.log(`[handleEventMoneyReturnResult]. Money return result received for order ${msg.orderNumber}: '${msg.result}'`);

    try{
        if (msg.result === 'SUCCESS') {
            const result = await orderModel.updateOrderStatus(msg.orderNumber, 'CANCELLED');
            const orderRow = result.rows[0];

            metricOrdersExecutionTotal.inc({status: "CANCELLED"});

            that.sendEventOrderStatusChanged(orderRow.Number);

        } else if (msg.result === 'ERROR') {

            console.error(`\x1b[31mERROR:\x1b[0m [handleEventMoneyReturnResult]. Money not returned for order ${msg.orderNumber}`);
            // const result = await orderModel.updateOrderStatus(msg.orderNumber, 'ERROR_MONEY_BACK');
            // const orderRow = result.rows[0];

            // that.sendEventOrderStatusChanged(orderRow.Number);

        } else {
            console.log(`[handleEventMoneyReturnResult] Unknown result '${msg.result}' for order ${msg.orderNumber}`);
        }

    } catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [handleEventMoneyReturnResult] ${e.message}`, e);
    }
    
};



// обработка события о результате резервирования на складе
var handleEventReservationResult = async function (message) {
    const msg = JSON.parse(message.value.toString());

    console.log(`[reservationResultHandler]. Reservation result received for order ${msg.orderNumber}  with result '${msg.result}'`);

    try{
        if (msg.result === 'SUCCESS') {
            const result = await orderModel.updateOrderStatus(msg.orderNumber, 'RESERVED');
            const orderRow = result.rows[0];

            that.sendEventOrderStatusChanged(orderRow.Number);
            
            that.sendEventDeliveryRequest(orderRow.Number);

        } else if (msg.result === 'ERROR') {
            const result = await orderModel.updateOrderStatus(msg.orderNumber, 'MONEY_BACK');
            const orderRow = result.rows[0];

            that.sendEventOrderStatusChanged(orderRow.Number);

            that.sendEventMoneyReturnRequest(orderRow.Number, orderRow.UserId, orderRow.Sum);

        } else {
            console.log(`[reservationResultHandler] Unknown result '${msg.result}' for order ${msg.orderNumber}`);
        }

    } catch (e) {
        console.error(`\x1b[31mERROR:\x1b[0m [reservationResultHandler] ${e.message}`, e);
    }
    
};

// обработка события о результате бронировании доставки
var handleEventDeliveryBookResult = async function (message) {
    const msg = JSON.parse(message.value.toString());

    console.log(`[handleEventDeliveryBookResult]. Delivery result received for order ${msg.orderNumber}: '${msg.isConfirmed}'`);

    try{
        // дата доставки подтверждена
        if (msg.isConfirmed) {
            // обновить статус в БД
            const result = await orderModel.updateOrderStatus(msg.orderNumber, 'DELIVERY');
            const orderRow = result.rows[0];

            // уведомить об обновлении статуса
            that.sendEventOrderStatusChanged(orderRow.Number);

            metricOrdersExecutionTotal.inc({status: "DELIVERY"});

        // дата доставки не подтверждена
        } else {
            // обновить статус в БД
            const result = await orderModel.updateOrderStatus(msg.orderNumber, 'MONEY_BACK');
            const orderRow = result.rows[0];

            // уведомить об обновлении статуса
            that.sendEventOrderStatusChanged(orderRow.Number);

            // отмена резерва
            that.sendEventReservationCancel(orderRow.Number);

            // возврат денег
            that.sendEventMoneyReturnRequest(orderRow.Number);

        } 

    } catch (e) {
        console.error(`[handleEventDeliveryBookResult] ${e.message}`, e);
    }
    
};



// connect the producer
connectProducer(); //.catch(e => console.error(`\x1b[31mERROR:\x1b[0m [order kafka producer] ${e.message}`, e))

// run the consumer
runKafkaConsumer(); //.catch(e => console.error(`\x1b[31mERROR:\x1b[0m [order kafka consumer] ${e.message}`, e));


// handle termination signals
const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

// errorTypes.forEach(type => {
//     process.on(type, async () => {
//         try {
//             console.log(`process.on ${type}`)
//             await producer.disconnect();
//             process.exit(0);
//         } catch (_) {
//             process.exit(1);
//         }
//     })
// })

signalTraps.forEach(type => {
    process.once(type, async () => {
        try {
            await producer.disconnect()
        } finally {
            process.kill(process.pid, type)
        }
    })
});

