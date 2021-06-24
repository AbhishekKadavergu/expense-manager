const express = require("express");
const Income = require("../models/income");
const auth = require("../middleware/auth");

const router = express.Router();

//POST create Incomes
router.post("/Incomes", auth, async (req, res) => {
  //   if (req.body.date) {
  //     req.body.date = new Date(req.body.date);
  //   }
  const income = new Income({
    ...req.body,
    owner: req.user._id,
  });

  try {
    await income.save();
    res.status(201).send(income);
  } catch (error) {
    res.status(404).send(error);
  }
});

//GET income by id
router.get("/Incomes/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const income = await Income.findOne({ _id, owner: req.user._id });
    if (!income) {
      return res.status(404).send("No income found!");
    }
    res.send(income);
  } catch (error) {
    res.status(500).send(error);
  }
});

//GET all Incomes of a user
router.get("/Incomes", auth, async (req, res) => {
  try {
    const income = await Income.find({ owner: req.user._id });
    console.log(income);
    // const tasks = await Tasks.find({ owner: req.user._id });
    if (!income) {
      return res.status(404).send();
    }
    if (income.length === 0) {
      return res.status(404).send();
    }
    res.send(income);
  } catch (error) {
    res.status(500).send();
  }
});

//GET Incomes within a given range
router.get("/Incomes/data/dates", auth, async (req, res) => {
  try {
    const startDate = req.body.start;
    const endDate = req.body.end;
    const income = await Income.find({
      owner: req.user._id,
      //   date: { $gte: "2021-06-09", $lte: "2021-06-24" },
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });
    console.log(income);
    if (!income) {
      return res.status(404).send();
    }
    if (income.length === 0) {
      return res.status(404).send();
    }
    res.send(income);
  } catch (error) {
    res.status(500).send();
  }
});

//DELETE income by ID
router.delete("/Incomes/:id", auth, async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!income) {
      return res.status(404).send();
    }
    res.send(income);
  } catch (error) {
    res.status(500).send();
  }
});

//PATCH update income by ID
router.patch("/Incomes/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const validUpdates = ["amount", "category", "date"];
  const isValid = updates.every((update) => validUpdates.includes(update));

  if (!isValid) {
    return res.status(404).send({ error: "Invalid updates!" });
  }

  try {
    // const task = await Tasks.findByIdAndUpdate(
    //   { _id: req.params.id },
    //   req.body,
    //   { new: true, runValidators: true }
    // );

    const income = await Income.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    console.log(income);
    if (!income) {
      return res.status(404).send();
    }
    updates.forEach((update) => (income[update] = req.body[update]));
    await income.save();
    res.send(income);
  } catch (error) {
    res.status(500).send(error);
  }
});

//DELETE all Incomes of a user
router.delete("/Incomes", auth, async (req, res) => {
  try {
    await Income.deleteMany({ owner: req.user._id });
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;
