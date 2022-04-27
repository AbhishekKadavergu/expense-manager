const mongoose = require("mongoose");
const validator = require("validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Expense = require("./expense");
const Income = require("./income");

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid email");
            }
        },
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (value.includes("password")) {
                throw new Error("Password should not contain the word password");
            }
            if (!validator.isLength(value, { min: 7 })) {
                throw new Error("Password must be greater than 6 characters length");
            }
        },
    },
    avatar: {
        type: Buffer,
    },
    tokens: [{
        token: {
            type: String,
            required: true,
        },
    }, ],
    age: {
        type: Number,
        validate(value) {
            if (value < 0) {
                throw new Error("Age should be positive");
            }
        },
    },
    questions: [{
        qst: {
            type: String,
            required: true
        },
        res: {
            type: String,
            required: true
        }
    }]

}, {
    timestamps: true,
});

// userSchema.virtual("tasks", {
//   ref: "Tasks",
//   localField: "_id",
//   foreignField: "owner",
// });

userSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;
    delete userObject.questions
    return userObject;
};

userSchema.methods.generateAuthToken = async function() {
    const user = this;
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
};

userSchema.statics.findUserByCredentials = async(email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("You are not registered");
    }
    const ismatch = await bcryptjs.compare(password, user.password);
    if (!ismatch) {
        throw new Error("Invalid credentials");
    }
    return user;
};

userSchema.pre("save", async function(next) {
    const user = this;
    if (user.isModified("password")) {
        user.password = await bcryptjs.hash(user.password, 8);
    }
    console.log("Just before save!");
    next();
});

userSchema.pre("remove", async function(next) {
    const user = this;
    await Expense.deleteMany({ owner: user._id });
    await Income.deleteMany({ owner: user._id });
    next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;