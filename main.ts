import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import * as flags from "https://deno.land/std@0.75.0/flags/mod.ts";

const DEFAULT_PORT = 8080;
const argPort = flags.parse(Deno.args).port;
const port = argPort ? Number(argPort) : DEFAULT_PORT;

if (isNaN(port)) {
  console.error("Port is not a number.");
  Deno.exit(1);
}

interface ServerRecord {
  game: string
  name: string,
  uri: string
  lastUpdated: Date,
  details?: any
}

class ServerStorage {
  static STORAGE_TIMEOUT = 10_000; // milliseconds
  static CLEANUP_INTERVAL = 1_000; // milliseconds

  servers: Map<string, ServerRecord> = new Map();

  addServer(record: Omit<ServerRecord, 'lastUpdated'>) {
    this.servers.set(`${record.uri}`, { ...record, lastUpdated: new Date() });
  }

  getServers(game?: string) {
    const values = [...this.servers.values()];
    if(game) {
      return values.filter(v => v.game === game);
    } else {
      return values;
    }
  }

  startCleanup() {
    setInterval(() => {
      const now = new Date()
      for(const [key, value] of this.servers.entries()) {
        if(now.getTime() - value.lastUpdated.getTime() > ServerStorage.STORAGE_TIMEOUT) {
          this.servers.delete(key);
        }
      }
    }, ServerStorage.CLEANUP_INTERVAL);
  }
}

const storage = new ServerStorage();
storage.startCleanup();

const router = new Router();
router
  .get('/', context => {
    context.response.body = storage.getServers();
  })
  .get('/:game', context => {
    context.response.body = storage.getServers(context.params.game);
  })
  .post('/', async context => {
    const body: Omit<ServerRecord, 'lastUpdated'> = await context.request.body({ type: 'json' }).value;
    if(typeof body.game !== 'string') context.throw(401, 'Expected `game` field to be string.')
    if(typeof body.uri !== 'string') context.throw(401, 'Expected `uri` field to be string.')
    if(typeof body.name !== 'string') context.throw(401, 'Expected `name` field to be string.')

    storage.addServer(body);

    context.response.status = 201;
  })

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());


console.log(`Listening on ${port}`);
await app.listen({ port });
