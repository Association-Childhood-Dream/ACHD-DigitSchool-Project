import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import routes from './routes.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req,res)=>res.json({ ok:true, service:"report" }));
app.use('/', routes);

const PORT = 3004;
app.listen(PORT, ()=> console.log('[report] listening on', PORT));
