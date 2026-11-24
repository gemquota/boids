import test from 'node:test';
import assert from 'node:assert/strict';
import {CENTIPEDE_SPRITES,INNER_CENTIPEDE_SPRITES,centipedeProgression,createCentipedeMorphology,centipedeSpriteIndex,centipedeSegmentCount,growCentipedeMass,initializeCentipede,advanceCentipede,sampleCentipedeTrail} from '../organisms/centipedes.js';

test('the 37 circle sprites form a connected hexagonal field',()=>{
 assert.equal(CENTIPEDE_SPRITES.length,37);
 for(const sprite of CENTIPEDE_SPRITES)assert.equal(centipedeProgression(sprite.index).length,37);
});
test('the seven inner sprites are possible genetic starting morphologies',()=>{
 assert.equal(INNER_CENTIPEDE_SPRITES.length,7);
 for(let i=0;i<=1;i++)assert.ok(INNER_CENTIPEDE_SPRITES.includes(createCentipedeMorphology({hue:155+i*85,speed:.8+i*.4,perception:.8+i*.4,metabolism:.8+i*.4,fertility:.8+i*.4}).origin));
});
test('a new centipede starts as exactly one art segment',()=>{
 const agent=initializeCentipede({id:1,x:12,y:24,age:0,energy:.9,traits:{hue:180,speed:1,perception:1,metabolism:1,fertility:1}});
 assert.equal(agent.segments.length,1);
 assert.deepEqual(agent.trail,[{x:12,y:24}]);
});
test('each segment evolves from the same inherited starting sprite at its own age',()=>{
 const morphology={origin:INNER_CENTIPEDE_SPRITES[0]};
 assert.equal(centipedeSpriteIndex(morphology,0),morphology.origin);
 assert.notEqual(centipedeSpriteIndex(morphology,36000),morphology.origin);
 assert.equal(centipedeProgression(morphology.origin).length,37);
});
test('new segments are added behind the original as mass increases',()=>{
 const agent=initializeCentipede({id:1,x:0,y:0,age:0,energy:1,traits:{hue:180,speed:1,perception:1,metabolism:1,fertility:1}});
 agent.mass=1.3;agent.age=1000;agent.x=5;advanceCentipede(agent,1);
 assert.equal(agent.segments.length,3);
 assert.equal(agent.segments[0].bornAt,0);
 assert.equal(agent.segments[1].bornAt,1000);
 assert.equal(agent.segments[2].bornAt,1000);
 assert.equal(agent.trail.length,2);
});
test('segment count begins at one and increases with mass',()=>{
 assert.equal(centipedeSegmentCount(.7),1);
 assert.ok(centipedeSegmentCount(3)>centipedeSegmentCount(.7));
 assert.ok(growCentipedeMass(.7,1,100)>.7);
 assert.equal(growCentipedeMass(.7,.1,100),.7);
});
test('body segments sample the actual movement trail behind the head',()=>{
 const point=sampleCentipedeTrail([{x:20,y:0},{x:10,y:0},{x:0,y:0}],15);
 assert.deepEqual(point,{x:5,y:0,angle:Math.PI});
});

test('movement history follows the short path across wrapped world edges',()=>{
 const agent=initializeCentipede({id:2,x:98,y:40,age:0,energy:1,traits:{hue:180,speed:1,perception:1,metabolism:1,fertility:1}});
 agent.x=2;advanceCentipede(agent,1,100,80);
 assert.equal(agent.trail.length,2);
 assert.equal(agent.trail[0].x,102);
});
