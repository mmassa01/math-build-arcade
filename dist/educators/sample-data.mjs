import {factBank,canonical,shift,SAMPLE_TODAY} from './model.mjs';
// Deterministic, entirely synthetic fixtures. No browser player saves are read.
export function createSampleData(){
 const facts=factBank(),schools=[{id:'tges',name:'Todd Grant Elementary'},{id:'mcms',name:'McIntosh County Middle'},{id:'mca',name:'McIntosh County Academy'}],classes=schools.flatMap((s,i)=>[0,1].map(j=>({id:`${s.id}-${j+1}`,schoolId:s.id,grade:[3,4,7,8,9,10][i*2+j],name:`Grade ${[3,4,7,8,9,10][i*2+j]} · ${j?'B':'A'}`,teacher:`Sample teacher ${i*2+j+1}`}))),students=[],factStates=[],checks=[],sessions=[],responses=[],snapshots=[];
 const names=['Jackson','Maya','Eli','Ava','Jordan','Riley','Morgan','Quinn','Alex','Casey','Taylor','Rowan'];
 for(const [ci,c] of classes.entries())for(let i=0;i<12;i++){
  const id=`sample-${ci+1}-${i+1}`,student={id,name:`${names[i]} ${String.fromCharCode(65+ci)}.`,schoolId:c.schoolId,classId:c.id,grade:c.grade};students.push(student);
  for(const [fi,f]of facts.entries()){const hash=(fi*31+i*17+ci*11)%100,allConfirmed=i>=10,stage=allConfirmed?4:hash<22?0:hash<44?1:hash<58?2:hash<73?3:4,hard=f.id===canonical('mul',6,7)&&i<8;
   factStates.push({studentId:id,factId:f.id,stage:hard?0:stage,refresh:!allConfirmed&&i===3&&stage===4&&fi%19===0?2:0,due:shift(SAMPLE_TODAY,hard?0:stage===4?7:((fi+i)%5)-2),lastSuccess:!hard&&stage?shift(SAMPLE_TODAY,-(fi%8+1)):null,rulesVersion:'pilot-1',source:'synthetic-fixture'});
  }
  if(i!==2&&i!==5)for(let w=0;w<3;w++)sessions.push({id:`session-${id}-${w}`,studentId:id,date:shift(SAMPLE_TODAY,-w*5),game:['horse','dragon','invaders'][w],demo:false,practiceMs:180000});
  for(const pathway of ['add','sub','mul','div','mixed']){
   if(i!==2&&i!==5)for(let w=0;w<3;w++){const correct=20+i+w*2,incorrect=i%4,timeouts=i%3,attempted=correct+incorrect+timeouts;checks.push({id:`check-${id}-${pathway}-${w}`,studentId:id,pathway,date:shift(SAMPLE_TODAY,-14+w*7),durationSeconds:90,correct,incorrect,timeouts,attempted,official:true,valid:true,rulesVersion:'pilot-1'});}
   for(let w=0;w<4;w++)snapshots.push({studentId:id,pathway,date:shift(SAMPLE_TODAY,-21+w*7),fullSetConfirmed:i>=(w===3?10:11),rulesVersion:'pilot-1'});
  }
  for(const focal of [canonical('mul',7,8),canonical('mul',6,7)])for(let k=0;k<4;k++)responses.push({id:`response-${id}-${focal}-${k}`,studentId:id,factId:focal,date:shift(SAMPLE_TODAY,-[11,8,4,0][k]),game:['horse','invaders','dragon','pong'][k],outcome:i<3&&k===3?'timeout':k===0?'incorrect':'correct',elapsedMs:k===0?1950:k===3&&i<3?3000:1260+k*220,assisted:false,demo:false});
 }
 return {schemaVersion:'1.0',meta:{mode:'sample',asOf:SAMPLE_TODAY,district:'McIntosh County Schools',rulesVersion:'pilot-1',responseLimitMs:3000,timezone:'America/New_York'},schools,classes,students,facts,factStates,checks,sessions,responses,snapshots};
}
