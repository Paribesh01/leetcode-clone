import { WebSocketServer } from "ws";
import url from "url";
import { ResultManager } from "./resultManager";

const wss = new WebSocketServer({ port: 8080 });
const resultManager = new ResultManager();

wss.on("connection", function connection(ws, req) {
  const { query } = url.parse(req.url as any, true);
  console.log("query is here ");
  console.log(query);

  resultManager.addUser(ws, query.taskid as string);

  ws.send("something");
});
