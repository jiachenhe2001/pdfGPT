import express from "express"; // javascript 写后端
import cors from "cors"; // 前后端port 不一样时，允许跨域访问
import dotenv from "dotenv"; // access .env
import multer from "multer"; // Import multer // 允许处理用户传来的文件 允许传文件
import chat from "./chat.js";
// 可以用 “import” 因为写了  "type": "module"

dotenv.config(); // 就可以用 .env 了

const app = express(); //初始化
app.use(cors()); // 允许第三方插件 cors

// Configure multer，存用户上传的文件在后端； multer 官网上都有这些代码
// configure multer 存的地方
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // 存在什么地方
  },
  filename: function (req, file, cb) {
    cb(null, "laioffer_" + file.originalname); // 存的名字叫什么
  },
});
// configure multer 本身
const upload = multer({ storage: storage }); // storage key, value 就是上面configure了的storage

const PORT = 5001; //后端的port
let filePath;

// express 定义 API

// POST /upload
// 设计 API 时要考虑
// 1. RESTful？ graphl？- What does the API do? Explain it in one sentence --> 允许用户上传pdf，我们在后端存下来这个pdf
// 2. Keyword 是什么？ GET， POST， PUT 。。。
// 3. input 是什么？ paylod? param?
// 4. output 是什么？
// 5. Status code？ 返回哪些？
app.post("/upload", upload.single("file"), async (req, res) => {
  // Use multer to handle file upload （upload.single()), "file"：containt
  // upload.single("file") 是【middleware】，先通过它做一些事，然后再跑（）=》 {}
  // 添加， 检查文件类型，上传失败怎么办。。。
  filePath = req.file.path; // The path where the file is temporarily saved
  res.send(filePath + " upload successfully.");
});

// GET /chat
// 用户问问题，我们给答案
app.get("/chat", async (req, res) => {
  const resp = await chat(req.query.question, filePath); // Pass the file path to your main function
  res.send(resp.text);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
