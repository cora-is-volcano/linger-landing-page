/* Original, source-grounded frontend simulation. No runtime, connectors or microphone are started. */
(() => {
  const root = document.getElementById('agent-demo');
  if (!root) return;
  const $ = selector => root.querySelector(selector);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 900px)');
  const mobileNav = matchMedia('(max-width: 700px)');
  const paths = {
    message:'M4 4h16v12H9l-5 4V4',library:'M4 4h4v16H4zM11 4h4v16h-4zM18 4l3 15',book:'M3 4h7l2 2 2-2h7v16h-7l-2 1-2-1H3zM12 6v15',
    plug:'M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-12 0V8m6 9v4',clock:'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
    computer:'M3 4h18v13H3zM8 21h8m-4-4v4',settings:'M4 7h16M4 17h16M8 4v6m8 4v6',agent:'M7 10a5 5 0 1 1 10 0 5 5 0 0 1-10 0M3 21c0-4 4-6 9-6s9 2 9 6',
    mic:'M9 6a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0V6m-3 5v2a6 6 0 0 0 12 0v-2m-6 8v3m-3 0h6',arrowUp:'M12 19V5m-6 6 6-6 6 6',arrow:'M5 12h14m-6-6 6 6-6 6',chevron:'m9 5 7 7-7 7',back:'M19 12H5m6-6-6 6 6 6',check:'m5 12 4 4L19 6',file:'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h5',
    calendar:'M4 5h16v16H4zM8 3v4m8-4v4M4 10h16',mail:'M3 5h18v14H3zM3 7l9 6 9-6',search:'M15 15l6 6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',download:'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',play:'m9 5 11 7-11 7V5',stop:'M6 6h12v12H6z',plus:'M12 4v16M4 12h16',edit:'m4 16 12-12 4 4L8 20H4v-4m10-10 4 4',close:'m6 6 12 12M6 18 18 6',globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18'
  };
  function icon(name) {
    const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('class','icon');s.setAttribute('aria-hidden','true');
    const p=document.createElementNS(s.namespaceURI,'path');p.setAttribute('d',paths[name]||paths.file);s.append(p);return s;
  }
  function el(tag,cls,text) {const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
  function button(text,handler,cls='lx-button',symbol) {const b=el('button',cls,text);b.type='button';if(symbol)b.prepend(icon(symbol));b.addEventListener('click',handler);return b;}
  root.querySelectorAll('[data-icon]').forEach(slot=>slot.replaceChildren(icon(slot.dataset.icon)));
  const input=$('#demo-input'), form=$('#demo-form'), send=$('#demo-send'), messages=$('#ad-messages'), panel=$('#lx-inspector-panel');
    const sources=[
    {title:'Acme launch',type:'Wiki · Project',text:'Goal: launch Acme’s design-team pilot on Friday.\n\nThe proposal and launch plan are ready. The wider rollout comes later. Contract sign-off is still open; Alex can confirm its owner.\n\nSource: launch check-in and email from Alex.'},
    {title:'Launch check-in',type:'Library · Meeting',text:'You: Let’s keep Friday as the target.\nAlex: The proposal is approved. I’ll find the person who can review the contract.\nYou: Please get their sign-off before we finalize the launch brief.\n\nDecision: keep the pilot focused on the design team.'},
    {title:'Contract review',type:'Gmail · Alex',text:'To: You\nSubject: Acme contract review\n\nThe launch plan looks good. I can help find the person who owns contract sign-off. Please send me the open questions before Friday.\n\nAlex'}
  ];
  const cases={
    research:{label:'Catch up',prompt:'Get me up to speed on the Acme launch.',reply:'The pilot is on track for Friday. The proposal is approved and the launch plan is ready. Contract sign-off is the one open item; Alex can help find its owner.',fallback:'Here’s a sample project update: the Acme pilot is on track, with contract sign-off still open.',title:'Acme launch',kind:'Project brief',trace:'3 sources connected',steps:[['Search project wiki','Found the design-team pilot scope and Friday target.'],['Read meeting notes','Matched the latest decision to the launch check-in.'],['Check Alex’s email','Contract-review owner still needs confirmation.']],tasks:['Review launch sources','Prepare the project brief']},
    plan:{label:'Plan ahead',prompt:'Make space for the Acme launch this week.',reply:'I’ve put the open decisions first and left a writing block before the afternoon review. This suggested plan uses the project priorities and your preference for uninterrupted mornings.',fallback:'Here’s a sample plan for Monday, with time to resolve the contract question, write the brief and review the result.',title:'A clearer Monday',kind:'Suggested plan',trace:'Project priorities + preferences',steps:[['Recall your preferences','Keep mornings clear for focused writing.'],['Review project priorities','Resolve contract sign-off before final review.'],['Shape a suggested plan','No calendar events have been created.']],tasks:['Review priorities','Draft the weekly plan']},
    followup:{label:'Follow through',prompt:'Draft a follow-up for Alex about the contract.',reply:'I’ve drafted the follow-up using the meeting notes and Alex’s email. It’s ready for your review.',fallback:'Here’s a sample follow-up for Alex, ready for your review.',title:'Contract follow-up',kind:'Email draft',trace:'Meeting notes + Alex’s email',steps:[['Read the latest context','Used the meeting decision and contract-review email.'],['Prepare a follow-up','Kept the open question and Friday checkpoint.'],['Wait for your review','External writes are held for an approval.']],tasks:['Check the open question','Prepare a follow-up draft']}
  };
  let current='research',view='messages',inspector='document',busy=false,composing=false,runId=0,timers=[],pending=null,cleanup=null,sourceIndex=null,rooms;
  const announce=text=>{$('#demo-composer-status').textContent=text;};
  const workspaceFocus=()=>root.contains(document.activeElement)?document.activeElement:null;
  const isVisible=node=>node?.isConnected&&node.getClientRects().length>0;
  function restoreViewFocus(previous,target){
    if(!previous||isVisible(previous)||!isVisible(target))return;
    const active=document.activeElement;
    // Keep deliberate focus on a surviving sidebar control or freshly focused content.
    if(active!==previous&&root.contains(active)&&isVisible(active))return;
    if(!target.hasAttribute('tabindex'))target.tabIndex=-1;
    target.focus({preventScroll:true});
  }
  function freshRooms(){return Object.fromEntries(Object.entries(cases).map(([key,c])=>[key,{draft:'',history:[{role:'user',text:c.prompt},{role:'assistant',text:c.reply,initialReply:true}],approval:'none',approvalDraft:null,focusAdded:false,step:3,canceled:false,editBuffer:null}]));}
  function syncAgentSelection(key=view==='messages'?'another-me':null){
    root.querySelectorAll('.lx-agent-link').forEach(node=>{
      const selected=(node.id==='lx-another-me'?'another-me':node.dataset.profile?.toLowerCase())===key;
      node.classList.toggle('is-current',selected);node.setAttribute('aria-pressed',String(selected));
    });
  }
  function revealCurrentNavigation(){
    if(!mobileNav.matches)return;
    const sidebar=$('.lx-sidebar'),active=sidebar.querySelector(`.lx-primary-nav>[data-open-view="${view}"],.lx-sidebar-bottom>[data-open-view="${view}"]`);
    if(!active)return;
    const bounds=sidebar.getBoundingClientRect(),item=active.getBoundingClientRect();
    if(item.left<bounds.left+7)sidebar.scrollLeft=Math.max(0,sidebar.scrollLeft+item.left-bounds.left-7);
    else if(item.right>bounds.right-7)sidebar.scrollLeft+=item.right-bounds.right+7;
  }
  function setPane(key){
    const previous=workspaceFocus();root.dataset.pane=key;
    root.querySelectorAll('[data-pane]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pane===key)));
    if(compact.matches)restoreViewFocus(previous,$(`[data-pane="${key}"]`));
  }
  function sync(){root.dataset.busy=String(busy);send.disabled=!busy&&(!input.value.trim()||composing);send.setAttribute('aria-label',busy?'Stop response':'Send message');send.replaceChildren(icon(busy?'stop':'arrowUp'));messages.setAttribute('aria-busy',String(busy));}
  function clearTimers(){runId++;timers.forEach(clearTimeout);timers=[];}
  function cancelRun(keep=false){
    clearTimers();
    if(pending){const r=rooms[pending.room];if(keep||r.draft)r.history.push({role:'assistant',text:'Stopped.',stopped:true});else{r.history=r.history.filter(m=>m!==pending.message);r.draft=pending.message.text;}r.canceled=true;pending=null;}
    busy=false;$('#lx-run-status').hidden=true;sync();
  }
  function setInspector(key,{focus=false,mobile=false}={}){
    const previous=workspaceFocus();
    if(mobile)setPane('detail');
    inspector=key;root.querySelectorAll('[data-inspector]').forEach(tab=>{const active=tab.dataset.inspector===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});panel.setAttribute('aria-labelledby',`lx-tab-${key}`);renderInspector();
    if(focus)$(`#lx-tab-${key}`).focus({preventScroll:true});
    else restoreViewFocus(previous,panel);
  }
  // Sample team members use the character artwork from the desktop app.
  const agentFigures = new Map([['another-me', 'capybara'], ['research', 'penguin'], ['writer', 'cat']]);
  function agentAvatar(id, label = '') {
    const figure = agentFigures.get(id);
    if (!figure) return null;
    const image = el('img', 'lx-agent-avatar');
    image.src = './media/agent-' + figure + '.svg';
    image.alt = label;
    image.width = 36;
    image.height = 36;
    return image;
  }
  function messageNode(message){
    const n=el('article',`lx-message lx-message--${message.role}`);
    if(message.role==='user'){n.append(el('span','sr-only','You: '),el('p','lx-message-copy',message.text));return n;}
    const image = agentAvatar('another-me', 'Another Me');
    const body=el('div');body.append(el('p','lx-message-copy',message.text));
    if(!message.stopped){
      body.append(button(cases[current].trace,()=>{sourceIndex=null;setInspector('sources',{focus:true,mobile:true});},'lx-source-link','book'));
      const task=button('2 background tasks completed',()=>setInspector('activity',{focus:true,mobile:true}),'lx-task-summary','check');task.append(icon('chevron'));body.append(task);
    }
    n.append(image,body);return n;
  }
  function renderMessages(){
    const history=rooms[current].history;
    messages.replaceChildren(...history.map(messageNode));
    messages.scrollTop=history.at(-1)?.initialReply ? 0 : messages.scrollHeight;
  }
  function renderRoom(){
    root.querySelectorAll('[data-room]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.room===current)));
    input.value=rooms[current].draft;renderMessages();setInspector(inspector);sync();
  }
  function openView(next,options={}){
    if(!['messages','library','wiki','routines','connectors','computer','agents'].includes(next))return;
    const previous=workspaceFocus();
    if(view==='messages')rooms[current].draft=input.value;
    cancelRun();if(cleanup){cleanup();cleanup=null;}
    view=next;root.dataset.view=next;$('#lx-message-view').hidden=next!=='messages';$('#lx-explorer').hidden=next==='messages';
    syncAgentSelection();
    root.querySelectorAll('[data-open-view]').forEach(b=>{if(b.dataset.openView===next)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    const api={icon,agentAvatar,announce,openView,openChat:(scene)=>openChat(scene),reducedMotion:()=>reduced.matches,...options,onAgentChange:syncAgentSelection,onRuntimeChange:label=>{$('#lx-runtime-label').textContent=label;}};
    if(next==='messages'){renderRoom();setPane('chat');}
    else if(next==='library')cleanup=window.LingerLibrary.render($('#lx-explorer'),api);
    else cleanup=window.LingerExplorer.render(next,$('#lx-explorer'),api);
    restoreViewFocus(previous,next==='messages'?$('#ad-room-title'):$('#lx-explorer .lx-page-head h3'));
    revealCurrentNavigation();
  }
  function switchRoom(key){if(!cases[key])return;const previous=workspaceFocus();rooms[current].draft=input.value;cancelRun();current=key;sourceIndex=null;inspector='document';if(view!=='messages')openView('messages');renderRoom();setInspector('document');setPane('chat');restoreViewFocus(previous,$('#ad-room-title'));}
  function openChat(scene='research'){switchRoom(cases[scene]?scene:'research');submit(cases[current].prompt,current,true);}
  function section(title){const s=el('section','lx-document-section');s.append(el('h4','',title));return s;}
  function checkLine(text){const p=el('div','lx-check-line');p.append(icon('check'),el('span','',text));return p;}
  function actions(...buttons){const a=el('div','lx-actions');a.append(...buttons);return a;}
  function downloadResult(){
    const text=current==='followup'?window.LingerLibrary.getDraft():current==='plan'?`09:30 Resolve the open decisions\n11:00 ${rooms.plan.focusAdded?'Two-hour focus block':'Write the launch brief'}\n15:00 Review with the team`:'Proposal approved. Launch plan ready.\nOpen item: contract sign-off.\nNext: ask Alex for the review owner.';
    const url=URL.createObjectURL(new Blob([`# ${cases[current].title}\n\n${text}\n\nLinger sample workspace\n`],{type:'text/markdown;charset=utf-8'}));const link=el('a');link.href=url;link.download=`linger-${current}.md`;root.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('Sample document downloaded.');
  }
  function renderDocument(){
    const r=rooms[current],c=cases[current];panel.append(el('p','lx-eyebrow',c.kind),el('h3','lx-document-title',c.title));
    if(current==='research'){
      panel.append(el('p','lx-document-intro','A focused pilot for the design team. Wider rollout comes next.'));
      const ready=section('Ready');ready.append(checkLine('Proposal approved'),checkLine('Launch plan prepared'));panel.append(ready);
      const attention=el('div','lx-attention');attention.append(el('strong','','Contract sign-off'),el('p','','Alex can confirm the owner before Friday.'));panel.append(attention);
      panel.append(actions(button('Draft follow-up',()=>openChat('followup'),'lx-button','arrow'),button('Open in Library',()=>openView('library',{initialTab:'documents',initialDocument:'brief'}),'lx-button','file')));
    }else if(current==='plan'){
      [['09:30','Resolve the open decisions'],['11:00',r.focusAdded?'Two-hour focus block':'Write the launch brief'],['15:00','Review with the team']].forEach(([time,title])=>{const line=el('div','lx-agenda-row');line.append(el('time','',time),el('span','',title));panel.append(line);});
      panel.append(actions(button(r.focusAdded?'Remove focus block':'Add focus block',()=>{r.focusAdded=!r.focusAdded;renderInspector();announce(r.focusAdded?'Focus block added to the sample plan.':'Sample focus block removed.');},'lx-button','calendar'),button('Make a Routine',()=>openView('routines'),'lx-button','clock')));
    }else{
      panel.append(el('p','lx-email-meta','To Alex · Re: Acme contract review'),el('p','lx-email-body',window.LingerLibrary.getDraft()));
      panel.append(actions(button(r.editBuffer!==null?'Continue editing':'Edit draft',editDraft,'lx-button','edit'),button('Review action',()=>{r.approval='pending';r.approvalDraft=window.LingerLibrary.getDraft();setInspector('activity',{mobile:true});},'lx-button','check')));
      if(r.approval==='approved'||r.approval==='declined')panel.append(el('p','lx-muted',r.approval==='approved'?'Approved in this sample workspace.':'Action declined. Your draft is kept.'));
    }
    panel.append(actions(button('Save file',downloadResult,'lx-source-link','download')));
  }
  function editDraft(){
    const draft=window.LingerLibrary.getDraft();panel.replaceChildren(el('p','lx-eyebrow','Email draft'),el('h3','lx-document-title','Contract follow-up'));
    const label=el('label','sr-only','Edit follow-up draft');label.htmlFor='lx-draft-editor';const editor=el('textarea','lx-editor');editor.id='lx-draft-editor';editor.value=rooms.followup.editBuffer??draft;editor.maxLength=6000;
    editor.addEventListener('input',()=>{rooms.followup.editBuffer=editor.value;editor.setCustomValidity('');});
    panel.append(label,editor,actions(button('Save draft',()=>{if(!editor.value.trim()){editor.setCustomValidity('Add a message before saving.');editor.reportValidity();return;}window.LingerLibrary.setDraft(editor.value);rooms.followup.editBuffer=null;rooms.followup.approval='none';renderInspector();panel.focus({preventScroll:true});announce('Draft saved in this sample workspace.');},'lx-button lx-button--primary','check'),button('Cancel',()=>{rooms.followup.editBuffer=null;renderInspector();panel.focus({preventScroll:true});})));editor.focus({preventScroll:true});
  }
  function renderActivity(){
    const r=rooms[current],c=cases[current];
    c.tasks.forEach((task,i)=>{const row=el('div','lx-card');row.append(el('strong','',task),el('p','lx-muted',r.canceled?'Stopped':busy&&r.step<=i?'Running':'Finished'));panel.append(row);});
    c.steps.forEach(([title,body],i)=>{const details=el('details',`lx-activity-item${busy&&i===r.step?' is-running':busy&&i>r.step?' is-pending':''}`);details.dataset.activityStep=String(i);const summary=el('summary');summary.append(icon(busy&&i>=r.step?'clock':'check'),el('span','',title),el('small','',r.canceled?(i<r.step?'Done':'Stopped'):busy?(i<r.step?'Done':i===r.step?'Running':'Queued'):'Done'));details.append(summary,el('p','',body));panel.append(details);});
    if(current==='followup'){
      const card=el('div','lx-approval');card.append(el('h4','','Review an external action'),el('p','','Email to Alex · Contract review for Acme'));
      if(r.approval==='approved'||r.approval==='declined')card.append(el('span','lx-pill',r.approval==='approved'?'Approved in demo':'Declined'));
      else if(r.canceled)card.append(el('p','lx-muted','Run the example again to prepare this action.'));
      else if(busy)card.append(el('p','lx-muted','Preparing the action for your review…'));
      else card.append(actions(button('Approve example',()=>{r.approval='approved';r.approvalDraft=window.LingerLibrary.getDraft();renderInspector();panel.focus({preventScroll:true});announce('Example approved. No email was sent.');},'lx-button lx-button--primary','check'),button('Decline',()=>{r.approval='declined';r.approvalDraft=window.LingerLibrary.getDraft();renderInspector();panel.focus({preventScroll:true});announce('Example declined. Your draft is still available.');})));
      panel.append(card);
    }
  }
  function renderSources(){
    if(sourceIndex!==null){const s=sources[sourceIndex];panel.append(button('Sources',()=>{sourceIndex=null;renderInspector();panel.focus({preventScroll:true});},'lx-source-link','back'));const body=el('div','lx-source-body');body.append(el('p','lx-eyebrow',s.type),el('h4','',s.title),el('p','',s.text));panel.append(body);return;}
    sources.forEach((s,i)=>{const b=button('',()=>{sourceIndex=i;renderInspector();panel.focus({preventScroll:true});},'lx-list-button');const copy=el('span');copy.append(el('strong','',s.title),el('small','',s.type));b.append(icon(i===0?'book':i===1?'mic':'mail'),copy,icon('chevron'));panel.append(b);});
    panel.append(actions(button('Explore Wiki',()=>openView('wiki'),'lx-source-link','book')));
  }
  function renderTeam(){
    panel.append(el('h3','lx-document-title','Acme launch team'));
    const lead=el('div','lx-team-node');const mark=agentAvatar('another-me');const copy=el('div');copy.append(el('strong','','Another Me'),el('small','','Coordinates & reports back'));lead.append(mark,copy);panel.append(lead);
    const branches = el('div', 'lx-team-branches');
    for (const [name, role] of [['Research', 'Find decisions & sources'], ['Writer', 'Turn findings into a draft']]) {
      const member = el('div', 'lx-team-node');
      member.append(agentAvatar(name.toLowerCase()), el('strong', '', name), el('small', '', role));
      branches.append(member);
    }
    panel.append(branches);
    panel.append(actions(button('Read team.md',()=>openView('library',{initialTab:'documents',initialDocument:'team'}),'lx-button','file'),button('Agent details',()=>openView('agents'),'lx-button','agent')));
  }
  function renderInspector(){
    const previous=workspaceFocus(),step=previous?.closest('.lx-activity-item')?.dataset.activityStep;
    const openSteps=new Set([...panel.querySelectorAll('.lx-activity-item[open]')].map(node=>node.dataset.activityStep));
    const followup=rooms.followup;
    if(followup.approval!=='none'&&followup.approvalDraft!==window.LingerLibrary.getDraft()){followup.approval='none';followup.approvalDraft=null;}
    panel.replaceChildren();if(inspector==='document')renderDocument();else if(inspector==='activity')renderActivity();else if(inspector==='sources')renderSources();else renderTeam();
    if(inspector==='activity')panel.querySelectorAll('.lx-activity-item').forEach(node=>{node.open=openSteps.has(node.dataset.activityStep);});
    const target=inspector==='activity'&&step!==undefined?panel.querySelector(`[data-activity-step="${step}"] summary`):panel;
    restoreViewFocus(previous,target||panel);
  }
  function route(text){if(/week|calendar|schedule|focus|monday|计划|本周|日程/i.test(text))return'plan';if(/follow.?up|email|draft|write|邮件|跟进/i.test(text))return'followup';if(/project|launch|brief|update|status|acme|项目|进度/i.test(text))return'research';return null;}
  function submit(text,forced,preserveDraft=false){
    const value=text.trim().slice(0,1000);if(!value||composing||busy)return;
    const origin=current,matched=forced||route(value),key=matched||current;
    if(key!==current){if(!preserveDraft){rooms[current].draft='';input.value='';}switchRoom(key);}
    const r=rooms[current],c=cases[current];
    if(r.history.length===2&&r.history[0].text===value)r.history=[];
    r.canceled=false;if(current==='followup')r.approval='none';const user={role:'user',text:value};r.history.push(user);if(!preserveDraft&&key===origin)r.draft='';input.value=r.draft;
    const token=++runId;pending={room:current,message:user};busy=true;r.step=0;renderMessages();sync();setPane('chat');
    const response=el('article','lx-message lx-message--assistant'),mark=agentAvatar('another-me', 'Another Me');const body=el('div'),copy=el('p','lx-message-copy');body.append(copy);response.append(mark,body);messages.append(response);messages.scrollTop=messages.scrollHeight;
    const reply=matched?c.reply:c.fallback;
    const later=(fn,ms)=>{timers.push(setTimeout(()=>{if(token===runId)fn();},ms));};
    const stage=index=>{r.step=index;$('#lx-run-status').hidden=false;$('#lx-run-label').textContent=c.steps[Math.min(index,2)][0];copy.textContent=index===0?'Working on it…':'';if(inspector==='activity')renderInspector();};
    const complete=()=>{if(token!==runId)return;r.history.push({role:'assistant',text:reply});r.history=r.history.slice(-14);r.step=3;pending=null;busy=false;timers=[];$('#lx-run-status').hidden=true;response.replaceWith(messageNode(r.history[r.history.length-1]));sync();if(inspector==='activity')renderInspector();messages.scrollTop=messages.scrollHeight;announce(`${c.label} ready. ${reply}`);};
    const stream=()=>{copy.textContent='';copy.classList.add('lx-streaming');$('#lx-run-label').textContent='Another Me is replying';let index=0;const chars=Array.from(reply);const tick=()=>{if(reduced.matches){complete();return;}const near=messages.scrollHeight-messages.scrollTop-messages.clientHeight<70;copy.textContent+=chars.slice(index,index+2).join('');index+=2;if(near)messages.scrollTop=messages.scrollHeight;if(index>=chars.length){complete();return;}later(tick,/[.!?]/.test(chars[index-1])?100:21);};tick();};
    stage(0);if(reduced.matches)later(complete,200);else{later(()=>stage(1),550);later(()=>stage(2),1050);later(stream,1450);}
  }
  root.querySelectorAll('[data-open-view]').forEach(b=>b.addEventListener('click',()=>openView(b.dataset.openView)));
  root.querySelectorAll('[data-profile]').forEach(b=>b.addEventListener('click',()=>openView('agents',{initialAgent:b.dataset.profile})));
  $('#lx-another-me').addEventListener('click',()=>openView('messages'));
  $('#lx-open-meeting').addEventListener('click',()=>openView('library',{initialTab:'meetings'}));
  root.querySelectorAll('[data-room]').forEach(b=>b.addEventListener('click',()=>switchRoom(b.dataset.room)));
  root.querySelectorAll('[data-pane]').forEach(b=>b.addEventListener('click',()=>setPane(b.dataset.pane)));
  const inspectorTabs=[...root.querySelectorAll('[data-inspector]')];
  inspectorTabs.forEach((b,index)=>{b.addEventListener('click',()=>setInspector(b.dataset.inspector));b.addEventListener('keydown',e=>{const destinations={ArrowRight:(index+1)%4,ArrowLeft:(index+3)%4,Home:0,End:3};if(e.key in destinations){e.preventDefault();setInspector(inspectorTabs[destinations[e.key]].dataset.inspector,{focus:true});}});});
  input.addEventListener('input',()=>{rooms[current].draft=input.value;sync();});input.addEventListener('compositionstart',()=>{composing=true;sync();});input.addEventListener('compositionend',()=>{composing=false;sync();});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){if(e.isComposing||composing||e.keyCode===229)return;e.preventDefault();if(!busy)submit(input.value);}});
  form.addEventListener('submit',e=>{e.preventDefault();if(busy){cancelRun(true);renderRoom();announce('Response stopped.');}else submit(input.value);});
  root.addEventListener('linger:open-scene',e=>{const key=e.detail?.scene;if(!Object.hasOwn(cases,key)||composing)return;e.preventDefault();openChat(key);});
  $('#ad-reset').addEventListener('click',()=>{cancelRun();cleanup?.();cleanup=null;window.LingerExplorer.reset();window.LingerLibrary.reset();rooms=freshRooms();composing=false;input.value='';current='research';inspector='document';sourceIndex=null;$('#lx-runtime-label').textContent='Local · Pi';openView('messages');input.focus({preventScroll:true});announce('Sample workspace reset.');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&busy){cancelRun();renderRoom();}});
  compact.addEventListener('change',()=>{if(compact.matches&&view==='messages')setPane(root.dataset.pane||'chat');});
  rooms=freshRooms();root.dataset.view='messages';syncAgentSelection();setPane('chat');renderRoom();setInspector('document');
})();
