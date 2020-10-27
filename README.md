# Master server

Deployed at https://my-master-server.herokuapp.com/

## Routes

- `GET /` list all servers
- `GET /:game` list servers for game
- `POST /` add server record

```typescript
interface ServerRecord {
  game: string
  name: string,
  host: string,
  port: string,
  lastUpdated: Date,
  details?: any
}
```
