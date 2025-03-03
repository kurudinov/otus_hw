// const ip = require('ip');
const profileModel = require('../models/profileModel');

const kafkaHost = process.env.KAFKA_HOST // || ip.address();

// kafka initialization
const topicUserReg = 'auth.user_registered';
const { Kafka, logLevel } = require('kafkajs');
const kafka = new Kafka({
    logLevel: logLevel.WARN,
    brokers: [`${kafkaHost}:9092`],
    clientId: 'profile-app',
});

groupRnd = (Math.random() + 1).toString(36).substring(7);
const consumer = kafka.consumer({ 
    groupId: 'profile', // + groupRnd, 
    allowAutoTopicCreation: true 
});

// consumer for user.registered event
const runKafkaConsumer = async () => {
    await consumer.connect();
    await consumer.subscribe({ topics: [topicUserReg], fromBeginning: false });
        
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const prefix = `${topic}[${partition}|${message.offset}]`;
            console.log(`\x1b[32m[event received]: ${prefix} ${message.value}\x1b[0m`);

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
runKafkaConsumer().catch(e => console.error(`\x1b[31mERROR:\x1b[0m [example/consumer] ${e.message}`, e));


// handle process termination
const errorTypes = ['unhandledRejection', 'uncaughtException'];
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

// errorTypes.forEach(type => {
//     process.on(type, async () => {
//         try {
//             console.log(`process.on ${type}`)
//             await kafkaProducer.disconnect()
//             process.exit(0)
//         } catch (_) {
//             process.exit(1)
//         }
//     })
// });

signalTraps.forEach(type => {
    process.once(type, async () => {
        try {
            await kafkaProducer.disconnect()
        } finally {
            process.kill(process.pid, type)
        }
    });
});
