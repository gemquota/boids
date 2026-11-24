import test from 'node:test';
import assert from 'node:assert/strict';
import {centerCameraState,clampCameraState} from '../core/camera.js';

test('camera starts centred on the world',()=>{
 const camera=centerCameraState(1200,800,2400,1600);
 assert.deepEqual(camera,{x:600,y:400,zoom:.5});
});
test('camera clamps all four edges to the world at zoom',()=>{
 const camera=clampCameraState({x:-9999,y:9999,zoom:2},1000,600,2000,1200);
 assert.deepEqual(camera,{x:-250,y:750,zoom:2});
 const left=camera.x+1000/2-1000/(2*camera.zoom);
 const right=camera.x+1000/2+1000/(2*camera.zoom);
 const top=camera.y+600/2-600/(2*camera.zoom);
 const bottom=camera.y+600/2+600/(2*camera.zoom);
 assert.ok(left>=0&&right<=2000&&top>=0&&bottom<=1200);
});
test('camera cannot zoom out far enough to expose space beyond the world',()=>{
 const camera=clampCameraState({x:0,y:0,zoom:.1},1200,800,900,600);
 assert.equal(camera.zoom,Math.max(1200/900,800/600));
 assert.equal(camera.x,-150);
 assert.equal(camera.y,-100);
});
