import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"; // for splitting step
import { OpenAIEmbeddings } from "langchain/embeddings/openai"; // text ==> vector [embedding]
import { MemoryVectorStore } from "langchain/vectorstores/memory"; //vectorstore 存在本地 memory
import { RetrievalQAChain } from "langchain/chains"; // 找相似的东西， step 4 retrival （similarity）
import { ChatOpenAI } from "langchain/chat_models/openai";
import { PromptTemplate } from "langchain/prompts"; // prompt template （问题+附加提供的内容）

import { PDFLoader } from "langchain/document_loaders/fs/pdf"; //项目是上传pdf，所以用pdf loader； 也可以load db/url。。。

// 用户问一个问题，这个 chat function return 一个 GPT 给的答案
// NOTE: change this default filePath to any of your default file name
const chat = async (query, filePath = "./uploads/affinder-grant.pdf") => {
  // step 1:
  // load 文件 （pdf）
  const loader = new PDFLoader(filePath);
  const data = await loader.load(); // await， 等 pdf load 结束才继续下一步 （like promise.then()) 所以前面要加 async 标注

  // step 2 splitting:
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500, //  (in terms of number of characters， 因为我们用的是简单的textsplitter； 确保每一段长度一样)
    chunkOverlap: 0,
  });
  const splitDocs = await textSplitter.splitDocuments(data); // await again， apply splitter to data; 一个array

  // step 3 storage vector ==》 embedding：
  // 用 OpenAI 的 embedding，文本转化成 vector
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.REACT_APP_OPENAI_API_KEY, // .env
    // 这是一个object （key ：Value）
  });

  const vectorStore = await MemoryVectorStore.fromDocuments(
    splitDocs, // array of docs
    embeddings // embedding 方法
  );

  // step 4: retrieval （optional），you can check the relevant splits it retrieved, langchain 分装好了，所以跟后面一步合并了；
  // 这里单纯是看看找到了什么
  //   const relevantDocs = await vectorStore.similaritySearch(
  //     "What is concept expression? "
  //   );

  // step 5: qa w/ customzie the prompt
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    openAIApiKey: process.env.REACT_APP_OPENAI_API_KEY,
  });

  const template = `Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know, don't try to make up an answer.
Use three sentences maximum and keep the answer as concise as possible.

{context}
Question: {question}
Helpful Answer:`;

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(), {
    prompt: PromptTemplate.fromTemplate(template),
    // returnSourceDocuments: true,
  });
  // model, vector, prompt 都放进去

  const response = await chain.call({
    query,
  }); // 调用chain，response 是一个text

  return response;
};

export default chat;
