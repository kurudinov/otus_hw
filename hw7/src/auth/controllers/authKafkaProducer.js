// const ip = require('ip');

const kafkaHost = process.env.KAFKA_HOST;// || ip.address()

// kafka init
const topicUserReg = 'auth.user_registered';
const { Kafka, logLevel } = require('kafkajs');
const kafka = new Kafka({
    logLevel: logLevel.INFO,
    brokers: [`${kafkaHost}:9092`],
    clientId: 'auth-app',
});
const kafkaProducer = kafka.producer({
    allowAutoTopicCreation: true
});

const connectToKafka = async () => {
    await kafkaProducer.connect();
}

connectToKafka().catch(e => console.error(`[auth producer] ${e.message}`, e))

exports.sendEventUserRegistered = async function (newUser) {

    try {
        await kafkaProducer.send({
            topic: topicUserReg,
            messages: [
                {
                    key: newUser.id,
                    value: JSON.stringify({
                        id: newUser.id,
                        email: newUser.email,
                        firstName: newUser.firstName,
                        lastName: newUser.lastName,
                        roles: newUser.roles
                    })
                }
            ]
        });

        console.log(`[kafka producer]. Message sent for userId '${newUser.id}'`);
    }
    catch (e) {
        console.error(`[kafka producer] ${e.message}`, e);
    }
};

// for Kafka
const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

errorTypes.forEach(type => {
    process.on(type, async () => {
        try {
            console.log(`process.on ${type}`)
            await kafkaProducer.disconnect()
            process.exit(0)
        } catch (_) {
            process.exit(1)
        }
    })
})

signalTraps.forEach(type => {
    process.once(type, async () => {
        try {
            await kafkaProducer.disconnect()
        } finally {
            process.kill(process.pid, type)
        }
    })
})
