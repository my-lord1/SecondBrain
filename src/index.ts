import express, {Request, Response} from "express";
import { UserModel } from "./db";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "./config";
import { z } from "zod";

const app = express();
app.use(express.json());

//defining zod schema
const signupSchema = z.object({
    username: z.string().min(3, "username must be at least 3 characters"),
    password: z.string().min(6, "password must be least 6 characters")
})

// @ts-ignore

app.post("/api/v1/signup", async (req: Request, res: Response) => {
    const validationResult = signupSchema.safeParse(req.body);

if(!validationResult.success) {
    return res.status(400).json({
        message: "Invalid Input",
        errors: validationResult.error.format()
    });
}

const { username, password } = validationResult.data;

    try {
        await UserModel.create({
            username,
            password
        })

        res.json({
            message: "User created successfully"
        })
    } catch(e) {
        res.status(411).json({
            message: "User already exists"
        })
    }
})

app.post("/api/v1/signin", async(req , res) => {
    const username = req.body.username;
    const password = req.body.password;

    const existingUser = await UserModel.findOne({
        username,
        password
    })

    if(existingUser) {
        const token = jwt.sign({
            id: existingUser._id
            }, JWT_PASSWORD)

            res.json({
                token
            })
    } else {
        res.status(403).json({
            message: "Incorrect credentials"
        })
    }
})


app.listen(5002, () => {
    console.log("Server is running on port 5000")
})