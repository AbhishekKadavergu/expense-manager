const express = require("express");
const Expense = require("../models/expense");
const auth = require("../middleware/auth");

const router = express.Router();

//POST create expenses
router.post("/expenses", auth, async(req, res) => {
    //   if (req.body.date) {
    //     req.body.date = new Date(req.body.date);
    //   }
    const expense = new Expense({
        ...req.body,
        owner: req.user._id,
    });

    try {
        await expense.save();
        res.status(201).send(expense);
    } catch (error) {
        res.status(404).send(error);
    }
});

//GET expense by id
router.get("/expenses/:id", auth, async(req, res) => {
    const _id = req.params.id;

    try {
        const expense = await Expense.findOne({ _id, owner: req.user._id });
        if (!expense) {
            return res.status(404).send("No expense found!");
        }
        res.send(expense);
    } catch (error) {
        res.status(500).send(error);
    }
});

//GET all expenses of a user
router.get("/expenses", auth, async(req, res) => {
    try {
        const expense = await Expense.find({ owner: req.user._id });
        console.log(expense);
        // const tasks = await Tasks.find({ owner: req.user._id });
        if (!expense) {
            return res.status(404).send({ "key": "Fail", "message": "No data found" });
        }
        if (expense.length === 0) {
            return res.status(404).send({ "key": "Fail", "message": "No data found" });
        }
        res.send(expense);
    } catch (error) {
        res.status(500).send({ error });
    }
});

//GET expenses within a given range
router.get("/expenses/data/dates", auth, async(req, res) => {
    console.log(req.query);
    try {
        // const startDate = req.body.start;
        // const endDate = req.body.end;
        const startDate = req.query.start;
        const endDate = req.query.end;
        const expense = await Expense.find({
            owner: req.user._id,
            //   date: { $gte: "2021-06-09", $lte: "2021-06-24" },
            date: { $gte: startDate, $lte: endDate },
        }).sort({ date: 1 });
        if (!expense) {
            return res.status(404).send({ "message": "No data found!" });
        }
        if (expense.length === 0) {
            return res.status(404).send({ "message": "No data found!" });
        }
        res.send(expense);
    } catch (error) {
        res.status(500).send();
    }
});

//DELETE expense by ID
router.delete("/expenses/:id", auth, async(req, res) => {
    try {
        const expense = await Expense.findOneAndDelete({
            _id: req.params.id,
            owner: req.user._id,
        });
        if (!expense) {
            return res.status(404).send();
        }
        res.send(expense);
    } catch (error) {
        res.status(500).send();
    }
});

//PATCH update expense by ID
router.patch("/expenses/:id", auth, async(req, res) => {
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

        const expense = await Expense.findOne({
            _id: req.params.id,
            owner: req.user._id,
        });

        console.log(expense);
        if (!expense) {
            return res.status(404).send();
        }
        updates.forEach((update) => (expense[update] = req.body[update]));
        await expense.save();
        res.send(expense);
    } catch (error) {
        res.status(500).send(error);
    }
});

//DELETE all expenses of a user
router.delete("/expenses", auth, async(req, res) => {
    try {
        await Expense.deleteMany({ owner: req.user._id });
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

module.exports = router;