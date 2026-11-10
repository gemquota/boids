/* Runtime registry for the simulation's range-based configuration controls. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.BoidsConfigRegistry=api;
})(typeof self!=='undefined'?self:globalThis,function(){
  'use strict';
  function precision(step){
    const value=String(step||'1').toLowerCase();
    if(value.includes('e-'))return Math.min(10,Number(value.split('e-')[1])||0);
    return Math.min(10,(value.split('.')[1]||'').length);
  }
  function clamp(value,min,max){return Math.max(min,Math.min(max,value))}
  function create(root,ids){
    const entries=[];
    for(const id of ids){
      const element=root.getElementById(id);
      if(!element||element.type!=='range')continue;
      const label=element.labels&&element.labels[0]||root.querySelector('label[for="'+id+'"]');
      const section=element.closest('[data-section]');
      const accordion=element.closest('details');
      const summary=accordion&&accordion.querySelector('summary');
      const step=Number(element.step)||1;
      entries.push(Object.freeze({
        id,element,label:label?label.textContent.trim():id,
        section:section?section.dataset.section:'',
        group:summary?summary.textContent.trim():'',
        min:Number(element.min),max:Number(element.max),step,
        precision:precision(element.step),defaultValue:Number(element.defaultValue??element.value)
      }));
    }
    const byId=new Map(entries.map(entry=>[entry.id,entry]));
    function normalize(id,value){
      const entry=byId.get(id);
      if(!entry||!Number.isFinite(Number(value)))return null;
      const min=Number(entry.element.min),max=Number(entry.element.max),step=Number(entry.element.step)||1;
      const bounded=clamp(Number(value),min,max);
      return Number((min+Math.round((bounded-min)/step)*step).toFixed(entry.precision));
    }
    function read(){
      const values={};
      for(const entry of entries)values[entry.id]=Number(entry.element.value);
      return values;
    }
    function apply(values){
      const applied={};
      for(const entry of entries){
        if(values[entry.id]===undefined)continue;
        const value=normalize(entry.id,values[entry.id]);
        if(value===null)continue;
        entry.element.value=String(value);
        const output=root.getElementById(entry.id+'Val');
        if(output)output.textContent=entry.id==='count'?value.toLocaleString():entry.precision?value.toFixed(entry.precision):String(value);
        applied[entry.id]=value;
      }
      return applied;
    }
    return Object.freeze({
      entries:Object.freeze(entries),
      ids:Object.freeze(entries.map(entry=>entry.id)),
      get:id=>byId.get(id)||null,
      normalize,read,apply
    });
  }
  return Object.freeze({create,precision});
});
