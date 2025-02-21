const ip = require('ip');
const profileModel = require('../models/profileModel');

const kafkaHost = process.env.KAFKA_HOST || ip.address();

// kafka initialization
const topicUserReg = 'user.registered';
const { Kafka, logLevel } = require('kafkajs');
const kafka = new Kafka({
    logLevel: logLevel.WARN,
    brokers: [`${kafkaHost}:9092`],
    clientId: 'auth-app',
});

const consumer = kafka.consumer({ groupId: 'user-profile' });

// consumer for user.registered event
const runKafkaConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topics: [topicUserReg], fromBeginning: true });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const prefix = `${topic}[${partition} | ${message.offset}]`;
            console.log(`[event received]: ${prefix} ${message.value}`);

            const profile = {
                userId: JSON.parse(message.value).id,
                age: 0,
                sex: "",
                avatarUri: ""
            };

            profileModel.createProfile(profile, (err, result) => {
                if (err) {
                    console.error("[create profile] Error", err);
                }
                else {
                    console.log(`[profile created]: Profile created for user '${profile.userId}'`);
                }
            });
        }
    });
};

// run the consumer
runKafkaConsumer().catch(e => console.error(`ERROR: [example/consumer] ${e.message}`, e));


// handle process termination
const errorTypes = ['unhandledRejection', 'uncaughtException'];
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

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
});

signalTraps.forEach(type => {
    process.once(type, async () => {
        try {
            await kafkaProducer.disconnect()
        } finally {
            process.kill(process.pid, type)
        }
    });
});
