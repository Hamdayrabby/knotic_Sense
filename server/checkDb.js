const mongoose = require('mongoose');
require('dotenv').config({ path: '/home/auni/Documents/knotic_Sense/server/.env' });
const Job = require('/home/auni/Documents/knotic_Sense/server/Models/Job');

async function checkJDs() {
    await mongoose.connect(process.env.MONGO_URI);
    const jobs = await Job.find({ "jdStructured": { $ne: null } }).limit(2);

    jobs.forEach(j => {
        console.log("Job:", j.title);
        console.log("Structured Skills:", j.jdStructured.coreSkills);
    });

    mongoose.disconnect();
}

checkJDs();
