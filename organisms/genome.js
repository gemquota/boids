// Hexadecimal chromosome codec. Genes are typed records, not positional trait arrays.
// Record layout: type:u8, locus:u16, payloadLength:u16, payload:bytes (all big-endian).
const TYPES=Object.freeze({trait:1,node:2,connection:3,regulator:4});
const NAMES=Object.freeze(Object.fromEntries(Object.entries(TYPES).map(([k,v])=>[v,k])));
const hex=b=>Array.from(b,x=>x.toString(16).padStart(2,"0")).join("").toUpperCase();
const bytes=s=>{if(typeof s!=="string"||s.length%2||!/^[0-9a-f]*$/i.test(s))throw new TypeError("Chromosome must be an even-length hexadecimal string");return Uint8Array.from(s.match(/.{2}/g)||[],x=>parseInt(x,16))};
function u16(n){if(!Number.isInteger(n)||n<0||n>65535)throw new RangeError("Expected unsigned 16-bit integer");return[n>>8,n&255]}
function f32(n){const b=new ArrayBuffer(4);new DataView(b).setFloat32(0,n,false);return[...new Uint8Array(b)]}
function readF32(b,o){return new DataView(b.buffer,b.byteOffset,b.byteLength).getFloat32(o,false)}
export function encodeChromosome(genes=[]){
 const out=[];for(const g of genes){const type=TYPES[g.type];if(!type)throw new TypeError("Unknown gene type: "+g.type);const locus=u16(g.locus??0);let p=[];
  if(g.type==="trait"){const name=new TextEncoder().encode(String(g.name));if(name.length>255)throw new RangeError("Trait name too long");p=[name.length,...name,...f32(Number(g.value))]}
  else if(g.type==="node"){p=[...u16(g.id),g.kind==="output"?1:g.kind==="hidden"?2:0,...f32(Number(g.bias??0))]}
  else if(g.type==="connection"){p=[...u16(g.source),...u16(g.destination),...f32(Number(g.weight??0)),g.enabled===false?0:1,...u16(g.innovation??0)]}
  else {p=[...u16(g.target??0),...f32(Number(g.value??0))]}
  out.push(type,...locus,p.length>>8,p.length&255,...p);
 }return hex(out)
}
export function decodeChromosome(sequence){
 const b=bytes(sequence),genes=[];let o=0;while(o<b.length){if(o+5>b.length)throw new TypeError("Truncated gene header");const type=NAMES[b[o++]],locus=(b[o++]<<8)|b[o++],len=(b[o++]<<8)|b[o++];if(!type||o+len>b.length)throw new TypeError("Invalid or truncated gene");const p=b.slice(o,o+len);o+=len;let g={type,locus};
  if(type==="trait"){const n=p[0];if(p.length!==1+n+4)throw new TypeError("Invalid trait gene");g.name=new TextDecoder().decode(p.slice(1,1+n));g.value=readF32(p,1+n)}
  else if(type==="node"){if(p.length!==7)throw new TypeError("Invalid node gene");g.id=(p[0]<<8)|p[1];g.kind=p[2]===1?"output":p[2]===2?"hidden":"input";g.bias=readF32(p,3)}
  else if(type==="connection"){if(p.length!==11)throw new TypeError("Invalid connection gene");g.source=(p[0]<<8)|p[1];g.destination=(p[2]<<8)|p[3];g.weight=readF32(p,4);g.enabled=p[8]!==0;g.innovation=(p[9]<<8)|p[10]}
  else {if(p.length!==6)throw new TypeError("Invalid regulator gene");g.target=(p[0]<<8)|p[1];g.value=readF32(p,2)}
  genes.push(g);
 }return genes
}
export function mutateChromosome(sequence,{rate=.02,scale=.08,random=Math.random}={}){
 const b=bytes(sequence);for(let i=0;i<b.length;i++)if(random()<rate)b[i]^=1<<Math.floor(random()*8);return hex(b)
}
export function recombineChromosomes(a,b,random=Math.random){
 const A=decodeChromosome(a),B=decodeChromosome(b),byKey=new Map(B.map(g=>[g.type+":"+g.locus,g]));return encodeChromosome(A.map(g=>{const other=byKey.get(g.type+":"+g.locus);return other&&random()<.5?other:g}).concat(B.filter(g=>!A.some(x=>x.type===g.type&&x.locus===g.locus)&&random()<.5)))
}
export const chromosomeBytes=sequence=>bytes(sequence).length;
