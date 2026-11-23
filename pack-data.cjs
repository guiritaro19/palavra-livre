const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
// Compacta as duas camadas: data/words.js (básica) e data/extras-pt.js (rara, sob demanda).
const jobs=[
  {file:'data/words.js',prefix:'window.DICTIONARIES = ',target:'DICTIONARIES',ready:'WORDS_READY'},
  {file:'data/extras-pt.js',prefix:'window.EXTRAS = ',target:'EXTRAS',ready:'EXTRAS_READY'}
];
for(const job of jobs){
  const target=path.join(__dirname,job.file);
  if(!fs.existsSync(target))continue;
  const source=fs.readFileSync(target,'utf8');
  if(source.startsWith('/* palavra-livre:gzip-v1 */')){console.log(job.file,'já compactado.');continue;}
  if(!source.startsWith(job.prefix)||!source.endsWith(';'))throw Error('Formato inesperado em '+job.file);
  const packed=zlib.gzipSync(Buffer.from(source.slice(job.prefix.length,-1)),{level:9}).toString('base64');
  const output=`/* palavra-livre:gzip-v1 */
window.${job.ready}=(async()=>{
  const raw=atob("${packed}"),bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  window.${job.target}=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();
})();
`;
  const temporary=target+'.tmp';fs.writeFileSync(temporary,output);fs.renameSync(temporary,target);
  console.log(job.file+':',source.length,'caracteres →',Buffer.byteLength(output),'bytes.');
}
