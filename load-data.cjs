const fs=require('node:fs'),vm=require('node:vm');
async function readPack(file,ready,key){
  const context={window:{},atob,Blob,Response,DecompressionStream};
  vm.runInNewContext(fs.readFileSync(__dirname+'/'+file,'utf8'),context);
  if(context.window[ready])await context.window[ready];
  return context.window[key];
}
// Camadas separadas: básica (sempre carregada) e rara (sob demanda).
async function loadLayers(){
  const core=await readPack('data/words.js','WORDS_READY','DICTIONARIES');
  const extras=fs.existsSync(__dirname+'/data/extras-pt.js')?await readPack('data/extras-pt.js','EXTRAS_READY','EXTRAS'):{pt:[]};
  return {core,extras};
}
// Base completa (básica + rara), usada pelos testes de busca.
async function loadData(){
  const {core,extras}=await loadLayers();
  return {...core,pt:[...core.pt,...extras.pt]};
}
module.exports=loadData;module.exports.loadLayers=loadLayers;
