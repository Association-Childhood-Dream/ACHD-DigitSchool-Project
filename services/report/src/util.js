export function ok(res, data={}, status=200){ return res.status(status).json({ ok:true, data }); }
export function err(res, message="error", status=400){ return res.status(status).json({ ok:false, error: message }); }
