import express, {Request, Response} from "express";
import { UserModel, LinkModel, ContentModel } from "./db";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "./config";
import { z } from "zod";
import { userMiddleware } from "./middleware";
import { random } from "./utils";

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}


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

app.post("/api/v1/content", userMiddleware, async(req , res)=> {
    const { link, type, tags, title } = req.body;
    

    await ContentModel.create({
        link,
        type,
        title,
        userId: req.userId,
        tags: [tags]
    })

    res.json({
        message: "Content added successfully"
    })
})

app.get("/api/v1/content", userMiddleware, async(req , res)=>{
    try{
    const userId = req.userId;
    const content = await ContentModel.find({
        userId: userId
    }).populate("userId", "username")
    res.json({
        content
    })
    }
    catch(e) {
        res.status(404).json({
            message: "Content not found"
        })
    }
})


app.delete("/api/v1/content", userMiddleware, async (req , res)=> {
    const contentId = req.body.contentId;
    try{
    await ContentModel.deleteMany({
        contentId,
        userId: req.userId
    })
    }
    catch(e) {
        res.status(404).json({
            message: "Content not found"
        })
    }

    res.json({
        message: "Content deleted successfully"
    })
})

app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
    const share = req.body.share;
    if (share) {
            const existingLink = await LinkModel.findOne({
                userId: req.userId
            });

            console.log("existing Link", existingLink);

            if (existingLink) {
                res.json({
                    hash: existingLink.hash
                })
                return;
            }
            const hash = random(10);
            console.log("hash value", hash);
            await LinkModel.create({
                userId: req.userId,
                hash: hash
            })

            res.json({
                hash
            })
    } else {
        await LinkModel.deleteOne({
            userId: req.userId
        });

        res.json({
            message: "Removed link"
        })
    }
})

app.get("/api/v1/brain/:shareLink", async (req, res) => {
    const hash = req.params.shareLink;

    const link = await LinkModel.findOne({
        hash
    });

    if (!link) {
        res.status(411).json({
            message: "Sorry incorrect input"
        })
        return;
    }
    // userId
    const content = await ContentModel.find({
        userId: link.userId
    })

    console.log(link);
    const user = await UserModel.findOne({
        _id: link.userId
    })

    if (!user) {
        res.status(411).json({
            message: "user not found, error should ideally not happen"
        })
        return;
    }

    res.json({
        username: user.username,
        content: content
    })

})








app.listen(5002, () => {
    console.log("Server is running on port 5002")
})