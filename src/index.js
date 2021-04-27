const express = require('express');
const app = express();
const userRouter = require('./routes/user');
const taskRouter = require('./routes/task');
const port = process.env.PORT;

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
	console.log(`server is up at port : ${port}`);
});
