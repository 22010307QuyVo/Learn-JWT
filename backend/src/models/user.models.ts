import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 20
    },
    email: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 50.
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    },
    admin: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model("User", userSchema);