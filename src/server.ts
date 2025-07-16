import 'dotenv/config';
import express, { Application, } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import formRoute from './routes/form'

const app: Application = express();

// Express Middlewares
app.use(helmet());
app.use(cors({
 origin: '*',
  credentials: true
}));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use(express.json());

app.use("/form", formRoute);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
