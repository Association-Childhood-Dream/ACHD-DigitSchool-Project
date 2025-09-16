import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import routes from './routes.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req,res)=>res.json({ ok:true, service:"timetable" }));
app.use('/', routes);

const PORT = 3000;
app.listen(PORT, ()=> console.log('[timetable] listening on', PORT));
