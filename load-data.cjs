const fs=require('node:fs'),vm=require('node:vm');
module.exports=async function loadData(){
  const context={window:{},atob,Blob,Response,DecompressionStream};
  vm.runInNewContext(fs.readFileSync(__dirname+'/data/words.js','utf8'),context);
  if(context.window.WORDS_READY)await context.window.WORDS_READY;
  return context.window.DICTIONARIES;
};
