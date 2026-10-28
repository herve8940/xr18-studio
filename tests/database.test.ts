import { test } from "node:test";
import assert from "node:assert/strict";
import { StudioDatabase } from "../src/database.js";
test("SQLite persists songs, rehearsals and setlists across reopen",()=>{
 const db=new StudioDatabase(":memory:");
 try{
  const song=db.addSong({title:"Plug In Baby",artist:"Muse",bpm:136});
  assert.equal(db.listSongs().length,1);
  assert.throws(()=>db.addSong({title:"",bpm:100}));
  const list=db.addSetlist({name:"Répétition",songIds:[song.id,song.id]});
  assert.deepEqual(db.listSetlists()[0]?.songIds,[song.id,song.id]);
  assert.equal(db.listSetlists()[0]?.id,list.id);
  db.addRehearsal({title:"Répétition du mardi",startsAt:"2026-11-03T19:00:00",notes:"Travail du refrain"});
  assert.equal(db.listRehearsals().length,1);
  assert.equal(db.deleteSong(song.id),true);
  assert.deepEqual(db.listSetlists()[0]?.songIds,[]);
 } finally{db.close();}
});
