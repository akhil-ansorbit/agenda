import express from 'express';
import Agenda from 'agenda';
const app = express();
const port = 3000;

const agenda = new Agenda({
  db: {
    address:
      'mongodb+srv://akhil:akhil123@cluster0.fzmjoft.mongodb.net/agenda?retryWrites=true&w=majority',
    options: {},
    // collection: `agendaJobs-${Math.random()}`,
    collection: `agendaJobs-1.0`,
  },
  maxConcurrency: 2,
});

function time() {
  return new Date().toTimeString().split(' ')[0];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let jobRunCount = 1;
agenda.define(
  'long-running job',
  {
    lockLifetime: 5 * 10, // max amount of time the job should take
    concurrency: 3, // max number of job instances to run at the same time
  },
  async (job, done) => {
    const thisJob = jobRunCount++;
    console.log(`#${thisJob} started`);

    // 3 job instances will be running at the same time, as specified by `concurrency` above
    await sleep(4 * 1000);
    // Comment the job processing statement above, and uncomment one of the blocks below

    /*
  // Imagine a job that takes 8 seconds. That is longer than the lockLifetime, so
  // we'll break it into smaller chunks (or set its lockLifetime to a higher value).
  await sleep(4 * 1000);  // 4000 < lockLifetime of 5000, so the job still has time to finish
  await job.touch();      // tell Agenda the job is still running, which resets the lock timeout
  await sleep(4 * 1000);  // do another chunk of work that takes less than the lockLifetime
  */

    // Only one job will run at a time because 3000 < lockLifetime
    // await sleep(3 * 1000);

    console.log(`#${thisJob} finished`);
    done();
  }
);

(async function () {
  console.log(time(), 'Agenda started');
  agenda.processEvery('1 second');
  await agenda.start();
  await agenda.every('1 second', 'long-running job');

  // Log job start and completion/failure
  agenda.on('start', (job) => {
    console.log(time(), `Job <${job.attrs.name}> starting`);
  });
  agenda.on('success', (job) => {
    console.log(time(), `Job <${job.attrs.name}> succeeded`);
  });
  agenda.on('fail', (error, job) => {
    console.log(time(), `Job <${job.attrs.name}> failed:`, error);
  });
})();

app.get('/ping', (req, res) => {
  res.send('pong????');
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
