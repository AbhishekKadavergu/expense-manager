const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user");
const auth = require("../middleware/auth");
// // Requiring module
// const reader = require("xlsx");

// // Reading our test file
// const file = reader.readFile("./test.xlsx");

// // Sample data set
// let student_data = [{
//         Student: "Nikhil",
//         Age: 22,
//         Branch: "ISE",
//         Marks: 70,
//     },
//     {
//         Student: "Amitha",
//         Age: 21,
//         Branch: "EC",
//         Marks: 80,
//     },
// ];

// const ws = reader.utils.json_to_sheet(student_data);

// reader.utils.book_append_sheet(file, ws, "Sheet3");

// // Writing to our file
// reader.writeFile(file, "./test.xlsx");

const router = express.Router();

router.post("/users", async(req, res) => {
    const user = new User(req.body);
    try {
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    } catch (error) {
        res.status(500).send(error);
    }
});

const creds = multer();
router.post("/users/login", creds.none(), async(req, res) => {
    try {
        const user = await User.findUserByCredentials(
            req.body.email,
            req.body.password
        );
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (error) {
        res.status(400).send({ error: error.message });
    }
});

router.post("/users/logout", auth, async(req, res) => {
    try {
        console.log(req.user);
        req.user.tokens = req.user.tokens.filter(
            (token) => token.token !== req.token
        );
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.post("/users/logoutAll", auth, async(req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
});

router.get("/users/me", auth, async(req, res) => {
    res.send(req.user);
});

// router.get("/users/:id", async (req, res) => {
//   console.log(req.params);

//   try {
//     const user = await User.findById({ _id: req.params.id });
//     if (!user) {
//       return res.status(404).send("No user found");
//     }
//     res.send(user);
//   } catch (error) {
//     res.status(500).send(error);
//   }
// });

router.patch("/users/me", auth, async(req, res) => {
    const updates = Object.keys(req.body);
    const validUpdates = ["name", "email", "password", "age"];
    const isValid = updates.every((update) => validUpdates.includes(update));

    if (!isValid) {
        return res.status(404).send({ error: "Invalid updates!" });
    }

    try {
        // const user = await User.findById(req.params.id);
        updates.forEach((update) => (req.user[update] = req.body[update]));
        await req.user.save();
        res.send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch("/users/me/changepwd", auth, async(req, res) => {
    const updates = Object.keys(req.body);
    const validUpdates = ["curent_password", "new_password", "confirm_password"];
    const isValid = updates.every((update) => validUpdates.includes(update));
    if (!isValid) {
        return res.status(404).send({ error: "Bad inputs!" });
    }

    try {
        const user = await User.findUserByCredentials(
            req.user.email,
            req.body.curent_password
        );

        user["password"] = req.body["confirm_password"];
        await user.save();
        res.status(200).send({ success: "Password updated successfully" });
    } catch (error) {
        res.status(403).send({ error: "Invalid credentials" });
    }
});

router.post("/users/forgotpwd", async(req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            throw new Error("Couldn't find your email");
        }
        const zeroOrOne = Math.round(Math.random());
        console.log(user["questions"][zeroOrOne]);
        res.status(200).send({
            question: {
                qst: user["questions"][zeroOrOne].qst,
                _id: user["questions"][zeroOrOne]._id,
            },
            email: user.email,
        });
    } catch (error) {
        res.status(404).send({ error: error.message });
    }
});

router.post("/users/setpwd", async(req, res) => {
    try {
        const user = await User.findOne({
            email: req.body.email,
            "questions._id": req.body.question._id,
            "questions.res": req.body.question.res,
        });
        // const user = await User.find({ "questions._id": req.body.question._id, "questions.res": req.body.question.res })
        if (!user) {
            throw new Error("Invalid response");
        }

        user["password"] = req.body.cpassword;
        await user.save();
        res.status(200).send(user);
    } catch (error) {
        res.status(403).send(error.message);
    }
});

router.delete("/users/me", auth, async(req, res) => {
    try {
        req.user.remove();
        res.send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
});

const upload = multer({
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Please upload jpg OR jpeg OR png files"));
        }
        cb(undefined, true);
    },
});

router.post(
    "/users/me/avatar",
    auth,
    upload.single("avatar"),
    async(req, res) => {
        const buffer = await sharp(req.file.buffer)
            .resize(250, 250)
            .png()
            .toBuffer();
        req.user.avatar = buffer;
        await req.user.save();
        res.send({ success: "Photo uploaded successfully" });
    },
    (error, req, res, next) => {
        res.status(400).send({ fail: error.message });
    }
);

router.delete("/users/me/avatar", auth, async(req, res) => {
    try {
        if (req.user.avatar) {
            req.user.avatar = undefined;
            await req.user.save();
            res.status(200).send({ success: "User avatar deleted successfully" });
        }
        res.status(404).send({ fail: "No avatar found" });
    } catch (error) {
        res.status(500).send({ fail: "Something went wrong" });
    }
});

router.get("/users/:id/avatar", async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error("No avatar found");
        }
        res.set("Content-Type", "image/jpg");
        res.send(user.avatar);
    } catch (error) {
        res.status(500).send({ fail: "Failed to get user photo" });
    }
});

module.exports = router;