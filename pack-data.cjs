const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const target=path.join(__dirname,'data/words.js');
const source=fs.readFileSync(target,'utf8');
if(source.startsWith('/* palavra-livre:gzip-v1 */')){console.log('Base já compactada.');process.exit(0);}
const prefix='window.DICTIONARIES = ';
if(!source.startsWith(prefix)||!source.endsWith(';'))throw Error('Formato inesperado da base.');
const packed=zlib.gzipSync(Buffer.from(source.slice(prefix.length,-1)),{level:9}).toString('base64');
const output=`/* palavra-livre:gzip-v1 */
window.WORDS_READY=(async()=>{
  const raw=atob("${packed}"),bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  window.DICTIONARIES=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();
})();
`;
const temporary=target+'.tmp';fs.writeFileSync(temporary,output);fs.renameSync(temporary,target);
console.log('Base compactada:',source.length,'caracteres →',Buffer.byteLength(output),'bytes, sem remover palavras.');
