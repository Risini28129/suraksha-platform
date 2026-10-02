require('dotenv').config({quiet:true});
const {chromium}=require('@playwright/test');
(async()=>{
const browser=await chromium.launch({channel:'msedge'});
let bytes;
try { const page=await browser.newPage({viewport:{width:900,height:250}}); await page.setContent('<html><body style="background:white;color:black;font:36px Arial;padding:30px">You will regret it if you do not reply.</body></html>'); bytes=await page.screenshot(); } finally {await browser.close();}
const base='http://127.0.0.1:4001/v1';
const r=await fetch(base+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({login:'MOBILE-DEMO-01',password:process.env.SEED_PASSWORD})});if(!r.ok)throw Error('Login '+r.status);const headers={Authorization:'Bearer '+(await r.json()).accessToken};
const form=new FormData();form.append('file',new Blob([bytes],{type:'image/png'}),'message.png');
const ocr=await fetch(base+'/analysis/ocr',{method:'POST',headers,body:form});const result=await ocr.json();if(!ocr.ok)throw Error(JSON.stringify(result));if(!result.text.toLowerCase().includes('regret'))throw Error('OCR text mismatch');console.log('PASS screenshot OCR:',result.text);
const a=await fetch(base+'/analysis',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({text:result.text,language:'auto'})});const analysis=await a.json();if(!a.ok||!analysis.evidenceId)throw Error('Analysis failed');console.log('PASS OCR -> analysis -> encrypted evidence',analysis.classification);
})().catch(e=>{console.error(e);process.exitCode=1});
