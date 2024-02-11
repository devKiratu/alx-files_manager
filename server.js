import Express from 'express';
import router from './routes';

const app = Express();
const PORT = process.env.PORT || 5000;

app.use(Express.json());
app.use(router);

app.listen(PORT);

export default app;
