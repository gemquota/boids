import test from 'node:test';
import assert from 'node:assert/strict';
import {CENTIPEDE_SPRITES,INNER_CENTIPEDE_SPRITES,centipedeProgression,createCentipedeMorphology,centipedeSpriteIndex,centipedeSegmentCount,growCentipedeMass} from '../organisms/centipedes.js';

test('the 37 circle sprites form a connected hexagonal field',()=>{
 assert.equal(CENTIPEDE_SPRITES.length,37);
 for(const sprite of CENTIPEDE_SPRITES)assert.equal(centipedeProgression(sprite.index).length,37);
});
test('the seven inner sprites are the possible genetic starting morphologies',()=>{
 assert.equal(INNER_CENTIPEDE_SPRITES.length,7);
 for(let i=0;i<=1;i++)assert.ok(INNER_CENTIPEDE_SPRITES.includes(createCentipedeMorphology({hue:155+i*85,speed:.8+i*.4,perception:.8+i*.4,metabolism:.8+i*.4,fertility:.8+i*.4}).origin));
});
test('segments progress outward along their inherited sprite path',()=>{
 const morphology={origin:INNER_CENTIPEDE_SPRITES[0]};
 assert.equal(centipedeSpriteIndex(morphology,0,0),morphology.origin);
 assert.notEqual(centipedeSpriteIndex(morphology,24000,0),morphology.origin);
 assert.equal(centipedeProgression(morphology.origin).length,37);
});
test('body segment count grows with mass and mass responds to feeding',()=>{
 assert.ok(centipedeSegmentCount(4)>centipedeSegmentCount(.5));
 assert.ok(growCentipedeMass(1,1,100)>1);
 assert.ok(growCentipedeMass(1,.1,100)<1);
});
