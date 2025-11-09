const email=localStorage.getItem('cp_current')||'guest';document.getElementById('who').textContent=email;const badgeEl=document.getElementById('badge');const outEl=document.getElementById('console');const codeArea=document.getElementById('codeArea');const runBtn=document.getElementById('runBtn');const saveBtn=document.getElementById('saveBtn');const taskTitle=document.getElementById('taskTitle');const taskHint=document.getElementById('taskHint');const casesTable=document.getElementById('casesTable');const casesCount=document.getElementById('casesCount');const params=new URLSearchParams(location.search);const problemId=params.get('problem')||'square5';const PROBLEMS_INDEX_URL='js/problems/index.json';const PROGRESS_KEY='arena_progress_'+email;let PROBLEM=null;function clearOut(){outEl.textContent=''}function writeOut(s){outEl.textContent+=s;outEl.scrollTop=outEl.scrollHeight}function normalizeLines(s){return s.replace(/\r/g,'').replace(/\s+$/,'').split('\n').map(l=>l.replace(/\s+$/,''))}function equalIO(a,b){const A=normalizeLines(a),B=normalizeLines(b);if(A.length!==B.length)return false;for(let i=0;i<A.length;i++)if(A[i]!==B[i])return false;return true}function loadProgress(){try{return JSON.parse(localStorage.getItem(PROGRESS_KEY)||'{}')}catch(e){return{}}}function saveProgress(p){localStorage.setItem(PROGRESS_KEY,JSON.stringify(p))}function setBadge(status){if(status==='passed'){badgeEl.innerHTML='Статус: <b class="ok">✓ Орындалды</b>'}else if(status==='failed'){badgeEl.innerHTML='Статус: <b class="bad">❌ Қате</b>'}else{badgeEl.innerHTML='Статус: —'}}function builtinRead(x){if(Sk.builtinFiles===undefined||Sk.builtinFiles['files'][x]===undefined)throw"Файл табылмады: '"+x+"'";return Sk.builtinFiles['files'][x]}async function runSingleCase(program,inputText){const inputBuffer=inputText.replace(/\r/g,'').split('\n');let captured='';function inputfun(){return(inputBuffer.length?inputBuffer.shift():'')}function outputfun(s){captured+=s}Sk.configure({output:outputfun,read:builtinRead,inputfun,__future__:Sk.python3});try{await Sk.misceval.asyncToPromise(()=>Sk.importMainWithBody('<stdin>',false,program,true));return{ok:true,out:captured}}catch(e){return{ok:false,out:captured,err:e.toString()}}}(async function(){const idxRes=await fetch(PROBLEMS_INDEX_URL);const index=await idxRes.json();const item=index.find(x=>x.id===problemId)||index[0];const res=await fetch(item.url);PROBLEM=await res.json();taskTitle.textContent=PROBLEM.title;taskHint.textContent=PROBLEM.statement;codeArea.value=PROBLEM.template||'';casesTable.innerHTML='';(PROBLEM.samples||[]).forEach((s,i)=>{const tr=document.createElement('tr');tr.innerHTML=`<td style="width:50%"><div class="muted">Input #${i+1}</div><pre>${s.input.replace(/</g,'&lt;')}</pre></td><td style="width:50%"><div class="muted">Expected Output #${i+1}</div><pre>${s.output.replace(/</g,'&lt;')}</pre></td>`;casesTable.appendChild(tr)});casesCount.textContent=(PROBLEM.samples||[]).length+' кейс';const prog=loadProgress();setBadge(prog[problemId]?.status)})();runBtn.addEventListener('click',async()=>{if(!PROBLEM)return;clearOut();const tests=PROBLEM.samples||[];let passed=0;for(let i=0;i<tests.length;i++){const tc=tests[i];writeOut(`\n— Case #${i+1} —\nInput:\n${tc.input}`);const res=await runSingleCase(codeArea.value,tc.input);if(!res.ok){writeOut(`\n❌ Runtime Error:\n${res.err}\n`);continue}writeOut(`\nYour Output:\n${res.out}`);const ok=equalIO(res.out,tc.output);if(ok){writeOut(`\n✅ OK\n`);passed++}else{writeOut(`\n❌ Wrong Answer\nExpected:\n${tc.output}\n`)}}writeOut(`\n===== Summary =====\n${passed}/${tests.length} passed\n`);const prog=loadProgress();prog[problemId]={status:(passed===tests.length?'passed':'failed'),attempts:(prog[problemId]?.attempts||0)+1,last:new Date().toISOString().split('T')[0]};saveProgress(prog);setBadge(prog[problemId].status)});saveBtn.addEventListener('click',()=>{localStorage.setItem('arena_code_'+email+'_'+problemId,codeArea.value)});

// ===== postMessage bridge for lesson.html =====
window.addEventListener('message', async (e) => {
  const msg = e.data;
  // lesson.js-тен келетін форматты тексереміз
  if (!msg || (msg.cmd !== 'run' && msg.type !== 'run')) return;

  const code  = String(msg.code || '');
  const stdin = String(msg.stdin || '');

  try {
    // Бізде бар runSingleCase() функциясын қолданамыз
    const res = await runSingleCase(code, stdin); // {ok, out, err?}
    // lesson.js осы reply='run' форматын күтеді
    parent.postMessage(
      { reply: 'run', payload: { stdout: res.out || '', stderr: res.ok ? '' : (res.err || '') } },
      '*'
    );
  } catch (err) {
    parent.postMessage(
      { reply: 'run', payload: { stdout: '', stderr: String(err || 'ERR') } },
      '*'
    );
  }
});
