const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const { initDB } = require("./config/dbConfig");
const logger = require("./logger");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(bodyParser.json());

app.use(
  cors({
    origin: "*", // your frontend URL
    credentials: true, // allow cookies / auth headers
  })
);

// Setup Morgan with Winston
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

app.get("/", (req, res) => res.send("OK"));

// Routes
const userRoutes = require("./routes/users.routes");
app.use("/api/v1/users", userRoutes);
const authRoutes = require("./routes/auth.routes");
app.use("/api/v1/auth", authRoutes);
const taskRoutes = require("./routes/task.routes");
app.use("/api/v1/task", taskRoutes);
const notificationRoutes = require("./routes/notification.routes");
app.use("/api/v1/notifications", notificationRoutes);
const commentRoutes = require("./routes/comments.routes");
app.use("/api/v1/comments", commentRoutes);
const fileRoutes = require("./routes/file.routes");
app.use("/api/v1/files", fileRoutes );


// Routes

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

const PORT = process.env.PORT || 5000;

(async () => {
  await initDB(); // ✅ DB + tables ready once
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
  });
})();
