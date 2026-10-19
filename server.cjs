const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{let file;try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400);res.end();return;}if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}if(file===root)file=path.join(root,'index.html');fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end('Arquivo não encontrado');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(data);});});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'A porta 4177 já está em uso. Abra http://127.0.0.1:4177 ou abra index.html diretamente.':error.message);process.exitCode=1;});
server.listen(4177,'127.0.0.1',()=>console.log('Palavra Livre: http://127.0.0.1:4177'));
