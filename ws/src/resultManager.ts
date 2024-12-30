import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "redis";

const redisClient = createClient();
redisClient.connect().then(() => console.log("Connected to Redis"));

export class ResultManager {
  private users: { ws: WebSocket; taskid: string; id: string }[];

  constructor() {
    this.users = [];
  }

  addUser(ws: WebSocket, taskid: string) {
    const id = uuidv4();
    this.users.push({ ws, taskid, id });
    console.log("User is added with ID:", id);

    this.sub(taskid);
  }

  async sub(taskid: string) {
    console.log(`Subscribed to taskid: ${taskid}`);

    await redisClient.subscribe(taskid, (message: string) => {
      console.log("Received message from Redis:", message);

      // Parse the message to get the result
      const parsedMessage = JSON.parse(message);

      let decodedResult = parsedMessage.result;
      if (typeof decodedResult === "string") {
        const cleanResult = decodedResult.replace(/^[^\x20-\x7E]+/, "").trim();
        console.log("Parsed and cleaned result:", cleanResult);

        this.broadcastToTask(taskid, JSON.stringify({ result: cleanResult }));

        this.disconnectUsersByTask(taskid);
        this.unsubscribe(taskid);
      } else {
        console.log("Unexpected result format:", decodedResult);
      }
    });
  }

  broadcastToTask(taskid: string, message: string) {
    this.users.forEach((user) => {
      if (user.taskid === taskid && user.ws.readyState === WebSocket.OPEN) {
        user.ws.send(message);
      }
    });
  }

  sendToUser(userId: string, message: string) {
    const user = this.users.find((user) => user.id === userId);
    if (user && user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(message);
    } else {
      console.log(`User ${userId} is not connected.`);
    }
  }

  disconnectUsersByTask(taskid: string) {
    this.users = this.users.filter((user) => {
      if (user.taskid === taskid) {
        if (user.ws.readyState === WebSocket.OPEN) {
          user.ws.close();
        }
        console.log(`User with taskid ${taskid} has been disconnected.`);
        return false;
      }
      return true;
    });
  }

  async unsubscribe(taskid: string) {
    console.log(`Unsubscribing from taskid: ${taskid}`);
    await redisClient.unsubscribe(taskid);
  }

  removeUser(userId: string) {
    this.users = this.users.filter((user) => user.id !== userId);
    console.log(`User ${userId} has been removed.`);
  }
}
