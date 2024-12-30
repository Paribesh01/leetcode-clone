import { createClient } from "redis";
import Docker from "dockerode";

const redisClient = createClient();
const docker = new Docker();

const processTasks = async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis");

    while (true) {
      const task = await redisClient.rPop("code_task");

      if (!task) {
        console.log("No tasks in the queue. Waiting for tasks...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      console.log("Task from the queue:", task);
      const taskData = JSON.parse(task);
      const { taskId, code, language, userId } = taskData;

      console.log(`Processing task ${taskId} for user ${userId}...`);

      try {
        const result = await executeCode(code, language);
        console.log(`Task ${taskId} processed. Result:`, result);

        redisClient.publish(taskId, JSON.stringify({ result: result }));
        console.log("sent to the redis pub");
      } catch (error) {
        console.error(`Error processing task ${taskId}:`, error);
      }
    }
  } catch (error) {
    console.error("Error connecting to Redis:", error);
  } finally {
    await redisClient.quit();
  }
};

const executeCode = async (code: string, language: string): Promise<string> => {
  return new Promise<string>(async (resolve, reject) => {
    let containerImage: string;
    let containerCmd: string[];

    switch (language.toLowerCase()) {
      case "python":
        containerImage = "python:3.9";
        containerCmd = ["python", "-c", code];
        break;
      case "javascript":
        containerImage = "node:16";
        containerCmd = ["node", "-e", code];
        break;
      case "java":
        containerImage = "openjdk:17";
        reject("Java execution requires compiling and running a .class file.");
        return;
      default:
        reject(`Unsupported language: ${language}`);
        return;
    }

    console.log(`Pulling Docker image: ${containerImage}`);
    try {
      await pullImage(containerImage);
    } catch (err) {
      reject(`Failed to pull Docker image: ${err}`);
      return;
    }

    docker.createContainer(
      {
        Image: containerImage,
        Cmd: containerCmd,
        Tty: false,
      },
      (err, container: any) => {
        if (err) {
          reject(`Error creating container: ${err}`);
          return;
        }

        container.start((startErr: any) => {
          if (startErr) {
            reject(`Error starting container: ${startErr}`);
            return;
          }

          console.log("Container started, capturing logs...");
          container.logs(
            { follow: true, stdout: true, stderr: true },
            (logErr: any, logs: any) => {
              if (logErr) {
                reject(`Error getting logs: ${logErr}`);
                return;
              }

              let output = "";
              logs.on("data", (data: any) => {
                output += data.toString();
              });

              logs.on("end", async () => {
                console.log("Logs captured. Removing container...");
                try {
                  await container.remove();
                  console.log("Container removed successfully.");
                  resolve(output);
                } catch (removeErr) {
                  reject(`Error removing container: ${removeErr}`);
                }
              });
            }
          );
        });
      }
    );
  });
};

const pullImage = async (imageName: string) => {
  const stream = await docker.pull(imageName);
  return new Promise((resolve, reject) => {
    docker.modem.followProgress(stream, (err, output) => {
      if (err) reject(err);
      else resolve(output);
    });
  });
};

processTasks();
