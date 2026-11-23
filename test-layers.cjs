const assert=require('node:assert/strict');
(async()=>{
  const {core,extras}=await require('./load-data.cjs').loadLayers();
  const basic=new Set(core.pt),rare=new Set(extras.pt);
  assert(basic.size<400000,'A camada básica do português deve ser enxuta.');
  assert(rare.size>1000000,'A camada rara guarda o restante do Hunspell.');
  for(const word of basic)assert(!rare.has(word),'Palavra repetida nas duas camadas: '+word);
  // Aceitas pelo Word Bot (conferidas manualmente) ficam sempre na camada básica.
  for(const word of ['casa','abacate','cabana','ostentaríeis','saojosedoscampos','açúcardebeterraba','estadosunidosdaamérica','emquantidadesuficiente','exércitodasalvação','estaçãobalneária','soparussadebeterraba','sociolingüística','cabarets','aardwark','baamas','a','aa'])assert(basic.has(word),'Falta na camada básica: '+word);
  // Rejeitadas pelo bot não entram em nenhuma camada.
  for(const word of ['inconstitucionalissimamente','edificarieis','desenfueiradíssimo','descarbonizadorezinhos','hexadáctilo','encornetei']){assert(!basic.has(word)&&!rare.has(word),'Deveria estar fora: '+word);}
  // Palavras que existem no dicionário ortográfico, mas o bot não lista, ficam só na camada rara.
  for(const word of ['aaleniana','aaronita','baalzinho'])assert(!basic.has(word)&&rare.has(word),'Deveria ser rara: '+word);
  for(const code of ['es','en','id'])assert(core[code].length>10000,code);
  console.log(`Camadas aprovadas: ${basic.size.toLocaleString('pt-BR')} palavras básicas, ${rare.size.toLocaleString('pt-BR')} raras, sem repetição.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
