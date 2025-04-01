import mongoose, {model, Schema} from "mongoose";

mongoose.connect("mongodb+srv://bhogesainivas:2DHnbZUchMwCBSxq@cluster0.wfvhldt.mongodb.net/")

const UserSchema = new Schema({
    username: {type: String, unique: true},
    password: String
})

export const UserModel = model("User", UserSchema);

