import Fastify from 'fastify';
import pino from 'pino'
import closeWithGrace from 'close-with-grace';

process.on('uncaughtException', err => {
  console.log('uncaught exception error:', err);
  getLogger().error(
    {
      module: 'server',
      error: err,
    },
    'uncaught exception'
  );
  process.exit(1);
});

async function start() {
  const server = Fastify({
    logger: pino(),
  });

  ///////////////////////
  // BEGIN sleep endpoint
  ///////////////////////

  var max_sleep_time = process.env.MAX_SLEEP_TIME || 10
  var sleep_times = Array.from(Array(max_sleep_time).keys())

  function sleep(seconds) {
    var ms = seconds * 1000
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async function probes(fastify, opts) {
    fastify.get('/healthz', async function (request, reply) {

      var sleep_time = sleep_times.pop()
      console.log(`sleeping for ${sleep_time}`)
      await sleep(sleep_time);
      return `ok; slept for ${sleep_time}\n`;
    });
  };

  await server.register(probes);

  /////////////////////
  // END sleep endpoint
  /////////////////////

  // const delay = 500
  const delay = 600 * 1000

  const closeListeners = closeWithGrace({ delay: delay }, async function ({
    signal,
    err,
    manual,
  }) {
    if (err) {
      server.log.error(
        {
          module: 'server',
          signal,
          manual,
          error: err,
        },
        'unhandled error shutting down server.'
      );
    }
    await server.close();
  });

  server.addHook('onClose', (instance, done) => {
    closeListeners.uninstall();
    done();
  });

  server.listen({ port: 3000 }, err => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }
  });
}

void start();
