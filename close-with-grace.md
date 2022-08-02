hi, first of all, thanks for fastify, close-with-grace, and adding the
close-with-grace snippet to the server template.

I was hoping that someone might be able to answer some questions about
gracefully exiting with fastify, pino (logging asynchronously), and
close-with-grace. these questions center around the effects I observe
using short (500 ms) and long (600 seconds) delay times with
close-with-grace.

there are three shell commands that I'm working with:

1. `alias run-server='pnpm node ./src/server.js'`
2. `alias curl-in-parallel='seq 1 10 | parallel -n0 curl -sS localhost:3000/healthz`
3. `alias kill-server='kill -SIGTERM $(ps ax | rg 'pnpm ts-node' | head -1 | clm 1)'`

in each example, I run each command in the order given above, each
command in a separate shell.

1. **when the close-with-grace delay is short, 500 ms**, this is what
   happens:

   GIF
   SCREENSHOT

   this behavior doesn't seem useful or graceful - many of my
   requests, which were initiated before sending `SIGTERM`, were
   dropped.

   this 500ms delay is taken straight from the [eject
   template][eject-template-delay]. what is the intent behind this
   value? is there merit in the behavior I've observed?

2. **when the close-with-grace delay is long, 600 seconds**, this is
   what happens:

   GIF
   SCREENSHOT

   this seems more like what I want - all of my requests were given
   time to complete. of course, this is a trivial example, and all of
   the requests take 10 seconds or less to complete.

   but still, you'll see that the server logs appear _after_ I've
   returned to my shell. what's going on here? I'm concerned that this
   behavior implies that I might lose logs when my production
   containers receive SIGTERM - is this true? if it's true that this
   configuration is liable to lose logs in prod, what alternatives are
   there besides synchronous logging with pino?

3. I'm curious as to why there should be _any_ finite delay in my use
   cases. if I'm running the server local, I can manually `SIGKILL`
   any process that isn't exiting cleanly. if I'm not running the
   server locally, it'll be running on kubernetes, and [kubernetes has
   its own strategy][k8s-sigkill] which also involves ultimately
   sending `SIGKILL`. I think I'd rather keep this killswitch behavior
   outside my app, but perhaps there's a good reason not to.

[eject-template-delay]: https://github.com/fastify/fastify-cli/blob/f4453bfff028844b2e0ce9930d4055d08fe018d5/templates/eject/server.js#L22
[k8s-sigkill]: https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/
