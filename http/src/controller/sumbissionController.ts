import { Request, Response } from "express";
import { createClient } from "redis";
import { v4 as uuidv4 } from "uuid";

const redisClient = createClient();

redisClient.connect().then(() => console.log("Connected to Redis"));

export const sumbitCode = async (req: Request, res: Response) => {
  try {
    const { code, language } = req.body;
    console.log("in sumbit");
    if (!code || !language) {
      res.status(400).send("Code and language are required");
    }
    const taskId = uuidv4();

    const task = {
      code,
      language,
      userId: req.user?.id,
      taskId,
    };
    console.log(task);

    await redisClient.lPush("code_task", JSON.stringify(task));
    console.log("sent to the queue");
    res.status(200).send({
      message: "Code submitted successfully. Your task is being processed.",
      taskId: task.taskId,
    });
  } catch (e) {
    console.log("something went wrong while sumbiting code ");
    res.status(500).send("Internal Server Error");
  }
};
