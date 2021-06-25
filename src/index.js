const express = require("express");
const cors = require("cors");

require("./db/mongoose");
const userRoutes = require("../src/routers/user");
const expenseRoutes = require("../src/routers/expense");
const incomeRoutes = require("../src/routers/income");

const User = require("../src/models/user");

const app = express();
app.use(cors());

app.use(express.json());
app.use(userRoutes);
app.use(expenseRoutes);
app.use(incomeRoutes);

const PORT = process.env.PORT;

app.get("/hello", (req, res) => {
  res.send("Hello World");
});

app.listen(PORT, () => {
  console.log(`App is running on port: ${PORT}`);
});
