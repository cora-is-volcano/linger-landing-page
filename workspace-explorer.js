/* Original, local-only product exploration based on Linger's public feature model.
   Fixtures never leave the page; configuration controls do not connect accounts. */
(() => {
  const makeState = () => ({
    preferences: 'Keep project updates concise.\nLead with the decision or next action.\nLink the original source.\nProtect two hours for focused writing.',
    runtime: 'Pi', inference: 'Local model',
    access: {},
    agents: [
      {id:'another-me',name:'Another Me',role:'Your personal agent',initial:'A',instructions:'Connect the context across my work. Bring in the right agents, keep the shared plan current, and surface the decisions that need me.',skills:['Personal context','Team coordination','Routines'],memory:['Start updates with the next decision.','Bundle non-urgent follow-ups into the morning brief.'],scene:'research'},
      {id:'research',name:'Research',role:'Research & source checking',initial:'R',instructions:'Find the original source, compare the evidence, and separate confirmed facts from open questions. Return a short brief with sources.',skills:['Knowledge search','Web research','Source checking'],memory:['Check the latest source before repeating a project deadline.','Keep open questions separate from confirmed decisions.'],scene:'research'},
      {id:'writer',name:'Writer',role:'Drafting & editing',initial:'W',instructions:'Turn the shared plan and source notes into a clear draft. Keep the requested tone, preserve the facts, and leave the result ready for review.',skills:['Documents','Email drafts','Editing'],memory:['Use a direct subject line for project follow-ups.','Ask for one clear next action in a short email.'],scene:'followup'}
    ],
    routines: [
      {id:'morning',name:'Morning brief',prompt:'Summarize today’s meetings and the project decisions that need me.',cadence:'Weekdays',time:'08:30',enabled:true},
      {id:'weekly',name:'Weekly wrap-up',prompt:'Collect this week’s project decisions and prepare next week’s priorities.',cadence:'Every week',time:'16:00',enabled:false}
    ],
    routineResults: {}, drafts:{preferences:null,routines:{},agent:null}, nextId:1
  });
  let state = makeState();
  let activeCleanup = null;
  const wikiPages = [
    {id:'acme',title:'Acme launch',type:'Project',summary:'Launch plan ready. Contract sign-off remains open.',sections:[['Current direction','Keep the agreed launch scope. Share the revised proposal on Friday.'],['Open item','Alex is checking who owns contract sign-off.'],['Next step','Prepare the follow-up and bring the final brief back for review.']],sources:[{title:'Launch check-in',kind:'Meeting transcript',text:'You: Let’s keep the agreed launch scope.\nAlex: The plan looks good. I’ll check who owns contract sign-off.\nYou: I’ll share the revised proposal on Friday.'},{title:'Email from Alex',kind:'Email',text:'The launch plan looks good. I can help find the person who owns contract sign-off. Please send me the open questions before Friday.'}]},
    {id:'maya',title:'Maya Chen',type:'Contact',summary:'Design partner for the Acme launch.',sections:[['Works on','Reviews the design direction and the revised proposal.'],['Working style','Prefers a short summary with a link to the current draft.']],sources:[{title:'Design review notes',kind:'Meeting notes',text:'Maya will review the revised proposal. Send a short summary with the current draft linked at the top.'}]},
    {id:'launch-session',title:'Launch check-in',type:'Session',summary:'Decisions, owners and open questions from the meeting.',sections:[['Decision','Keep the agreed launch scope.'],['Action items','You: revise and share the proposal by Friday.\nAlex: identify the contract-review owner.'],['Related pages','Acme launch · Maya Chen']],sources:[{title:'Meeting transcript',kind:'Recorded conversation',text:'Alex: Revised proposal by Friday.\nYou: I’ll send it to Maya.\nAlex: I’ll check the contract-review owner.'}]},
    {id:'focus',title:'Writing workflow',type:'Topic',summary:'How a first draft moves from source notes to review.',sections:[['Approach','Gather the decisions and original sources before drafting.'],['Drafting','Write a short first version in a focused work block.'],['Review','Check facts and tone before sharing.']],sources:[{title:'Planning conversation',kind:'Conversation',text:'Let’s keep the first version short. Make room for two hours of writing, then review the details together.'}]}
  ];
  const apps = [
    {id:'gmail',name:'Gmail',initial:'M',icon:'mail',read:['Search messages','Read threads'],write:['Create a draft','Send a message'],scene:'followup'},
    {id:'calendar',name:'Google Calendar',initial:'C',icon:'calendar',read:['Find events','Check availability'],write:['Create an event','Update an event'],scene:'plan'},
    {id:'slack',name:'Slack',initial:'S',icon:'plug',read:['Search messages','Read a thread'],write:['Send a message','Reply in a thread'],scene:'research'},
    {id:'notion',name:'Notion',initial:'N',icon:'book',read:['Find pages','Read page content'],write:['Create a page','Update a page'],scene:'research'},
    {id:'drive',name:'Google Drive',initial:'D',icon:'file',read:['Find files','Read documents'],write:['Create a file','Update a document'],scene:'research'},
    {id:'github',name:'GitHub',initial:'G',icon:'plug',read:['Search repositories','Read issues and code'],write:['Create an issue','Comment on an issue'],scene:'research'}
  ];

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const button = (text, action, primary = false) => {
    const node = el('button',`lx-button${primary ? ' lx-button--primary' : ''}`,text);
    node.type = 'button';
    node.addEventListener('click',action);
    return node;
  };
  const textBlock = (label, text) => {
    const section = el('section','lx-detail');
    section.append(el('h4','',label),el('p','',text));
    return section;
  };
  let fieldSequence = 0;
  const field = (label, control) => {
    const wrapper = el('label','lx-field');
    const controlId = `lx-form-field-${++fieldSequence}`;
    const caption = el('span','',label); caption.id = `${controlId}-label`;
    control.id = controlId; control.setAttribute('aria-labelledby',caption.id); wrapper.htmlFor = controlId;
    wrapper.append(caption,control);
    return wrapper;
  };
  const input = (value = '', max = 100) => {
    const node = el('input'); node.type = 'text'; node.value = value; node.maxLength = max; return node;
  };
  const editor = (value, rows = 4) => {
    const node = el('textarea','lx-editor'); node.value = value; node.rows = rows; node.maxLength = 2000; return node;
  };
  const pill = text => el('span','lx-pill',text);
  const choose = (values, value, onChange, label) => {
    const group = el('div','lx-tabs'); group.setAttribute('role','group'); group.setAttribute('aria-label',label);
    values.forEach((item,index) => {
      const node = button(item,() => {
        const host = group.closest('.lx-page')?.parentElement;
        const restoreFocus = document.activeElement === node;
        onChange(item);
        if (restoreFocus) {
          const nextGroup = Array.from(host?.querySelectorAll('[role="group"]') || []).find(candidate => candidate.getAttribute('aria-label') === label);
          Array.from(nextGroup?.querySelectorAll('button') || []).find(candidate => candidate.textContent === item)?.focus({preventScroll:true});
        }
      });
      node.addEventListener('keydown',event => {
        const next={ArrowRight:(index+1)%values.length,ArrowLeft:(index+values.length-1)%values.length,Home:0,End:values.length-1}[event.key];
        if(next===undefined)return;
        event.preventDefault();const target=group.querySelectorAll('button')[next];target.focus({preventScroll:true});target.click();
      });
      node.setAttribute('aria-pressed',String(item === value)); group.append(node);
    });
    return group;
  };

  function render(view, host, api) {
    activeCleanup?.();
    let disposed = false;
    let timers = [];
    let busyRoutine = null;
    let runVersion = 0;
    const clearTimers = () => { runVersion++; timers.forEach(clearTimeout); timers = []; busyRoutine = null; };
    const cleanup = () => { disposed = true; clearTimers(); if (activeCleanup === cleanup) activeCleanup = null; };
    activeCleanup = cleanup;
    const later = (fn, delay) => { timers.push(setTimeout(() => { if (!disposed) fn(); },delay)); };
    const announce = text => { if (!disposed) api.announce(text); };
    const icon = name => api.icon(name);
    const keyed = (node,key) => { node.dataset.lxFocus = key; return node; };
    const focusKey = key => {
      if (key && !disposed) Array.from(host.querySelectorAll('[data-lx-focus]')).find(node => node.dataset.lxFocus === key)?.focus({preventScroll:true});
    };
    const currentFocusKey = () => host.contains(document.activeElement) ? document.activeElement.dataset.lxFocus : null;
    const heading = (title, action) => {
      const page = el('div','lx-page');
      const head = el('header','lx-page-head'); head.append(el('h3','',title));
      if (action) head.append(action);
      page.append(head); host.replaceChildren(page); return page;
    };
    const listButton = (title, description, selected, action, iconName, key = title) => {
      const node = button('',() => {
        const restoreFocus = document.activeElement === node;
        action();
        if (restoreFocus) Array.from(host.querySelectorAll('.lx-list-button')).find(candidate => candidate.dataset.itemKey === key)?.focus({preventScroll:true});
      }); node.className = 'lx-list-button'; node.dataset.itemLabel = title; node.dataset.itemKey = key;
      node.setAttribute('aria-pressed',String(selected));
      if (iconName) node.append(icon(iconName));
      const copy = el('span'); copy.append(el('strong','',title));
      if (description) copy.append(el('small','lx-muted',description));
      node.append(copy); return node;
    };

    function wikiView() {
      let selected = 'acme', tab = 'Pages', source = null, editing = false;
      let query = '';
      function draw() {
        const page = heading('Wiki & memory');
        page.append(choose(['Pages','Preferences'],tab,next => { tab = next; editing = false; draw(); },'Wiki sections'));
        if (tab === 'Preferences') {
          const card = el('article','lx-card'); card.append(pill('Shared context'),el('h4','','How I like to work'));
          if (editing) {
            const form = el('form','lx-form'); const text = editor(state.drafts.preferences ?? state.preferences,5); text.required = true;
            form.append(field('Preferences',text));
            const actions = el('div','lx-toolbar'); const save = button('Save in demo',() => {},true); save.type = 'submit';
            actions.append(save,button('Cancel',() => { state.drafts.preferences = null; editing = false; draw(); focusKey('edit-preferences'); })); form.append(actions);
            form.addEventListener('submit',event => {
              event.preventDefault();
              if (!text.value.trim()) { text.setCustomValidity('Add a preference.'); text.reportValidity(); return; }
              state.preferences = text.value.trim(); state.drafts.preferences = null; editing = false; draw(); focusKey('edit-preferences'); announce('Shared preferences updated in this demo.');
            });
            text.addEventListener('input',() => { text.setCustomValidity(''); state.drafts.preferences = text.value; }); card.append(form);
          } else {
            card.append(el('p','lx-preline',state.preferences),keyed(button('Edit preferences',() => { editing = true; draw(); host.querySelector('textarea')?.focus({preventScroll:true}); }),'edit-preferences'));
          }
          page.append(card); return;
        }
        const toolbar = el('div','lx-toolbar');
        const search = input(query,150); search.type = 'search'; search.className = 'lx-search'; search.placeholder = 'Search your wiki'; search.setAttribute('aria-label','Search wiki pages');
        toolbar.append(search,pill('Shared across agents')); page.append(toolbar);
        const grid = el('div','lx-grid lx-grid--master-detail'); const list = el('nav','lx-card'); list.setAttribute('aria-label','Wiki pages'); const detail = el('article','lx-card lx-detail');
        grid.append(list,detail); page.append(grid);
        const matching = () => wikiPages.filter(item => `${item.title} ${item.type} ${item.summary} ${item.sections.flat().join(' ')}`.toLowerCase().includes(query.toLowerCase()));
        function drawList() {
          list.replaceChildren();
          const pages = matching();
          if (!pages.length) {
            selected=null;source=null;
            list.append(el('p','lx-muted','No matching pages.'),button('Clear search',() => { query = ''; search.value = ''; drawList(); drawDetail(); search.focus(); })); return;
          }
          if(!pages.some(item=>item.id===selected)){selected=pages[0].id;source=null;}
          pages.forEach(item => list.append(listButton(item.title,item.type,item.id === selected,() => { selected = item.id; source = null; drawList(); drawDetail(); },'file',item.id)));
        }
        function drawDetail() {
          const item = wikiPages.find(entry => entry.id === selected);
          detail.replaceChildren();
          if(!item)return;
          if (source !== null) {
            const original = item.sources[source];
            detail.append(button('Back to page',() => { const previous = original.title; source = null; drawDetail(); Array.from(detail.querySelectorAll('button')).find(candidate => candidate.textContent === previous)?.focus({preventScroll:true}); }),pill(original.kind),el('h4','',original.title),el('p','lx-preline',original.text)); return;
          }
          detail.append(pill(item.type),el('h4','',item.title),el('p','lx-muted',item.summary));
          item.sections.forEach(([label,text]) => detail.append(textBlock(label,text)));
          const sources = el('section','lx-detail'); sources.append(el('h4','','Original sources'));
          item.sources.forEach((original,index) => {
            const link = button(original.title,() => { source = index; drawDetail(); detail.querySelector('button')?.focus({preventScroll:true}); }); link.prepend(icon('file')); sources.append(link);
          });
          detail.append(sources,button('Ask about this project',() => api.openChat('research'),true));
        }
        search.addEventListener('input',() => { query = search.value; drawList(); drawDetail(); }); drawList(); drawDetail();
      }
      draw();
    }

    function connectorsView() {
      let selected = 'gmail';
      function draw() {
        const page = heading('Connected apps');
        const grid = el('div','lx-grid lx-grid--master-detail'); const list = el('nav','lx-card'); list.setAttribute('aria-label','Available apps');
        const detail = el('article','lx-card lx-detail');
        apps.forEach(app => list.append(listButton(app.name,'',app.id === selected,() => { selected = app.id; draw(); },app.icon,app.id)));
        const app = apps.find(item => item.id === selected);
        const title = el('div','lx-row'); title.append(icon(app.icon),el('h4','',app.name),pill('Not connected')); detail.append(title);
        const tools = el('div','lx-grid');
        [['Read',app.read],['Write',app.write]].forEach(([label,items]) => {
          const block = el('section','lx-detail'); block.append(el('h4','',label));
          const ul = el('ul'); items.forEach(text => ul.append(el('li','',text))); block.append(ul); tools.append(block);
        });
        detail.append(tools);
        const access = el('fieldset','lx-detail'); access.append(el('legend','','Agent access preview'));
        state.access[app.id] ||= ['another-me'];
        state.agents.forEach(agent => {
          const label = el('label','lx-row'); const control = el('input'); control.type = 'checkbox'; control.checked = state.access[app.id].includes(agent.id);
          control.addEventListener('change',() => {
            state.access[app.id] = control.checked ? [...new Set([...state.access[app.id],agent.id])] : state.access[app.id].filter(id => id !== agent.id);
            announce(`${agent.name} ${control.checked ? 'included in' : 'removed from'} the ${app.name} access preview.`);
          });
          label.append(control,el('span','',agent.name)); access.append(label);
        });
        detail.append(access,button('Try a connected-work example',() => api.openChat(app.scene),true));
        grid.append(list,detail); page.append(grid);
      }
      draw();
    }

    function routinesView() {
      let editingId = null;
      let creating = false;
      function draw() {
        const focus = currentFocusKey();
        const newRoutine = keyed(button('New routine',() => { clearTimers(); creating = true; editingId = null; draw(); focusKey('routine-name'); },true),'new-routine');
        const page = heading('Routines',creating || editingId ? null : newRoutine);
        if (creating || editingId) { drawForm(page); focusKey(focus); return; }
        const list = el('div','lx-routine-list');
        state.routines.forEach(routine => {
          const card = el('article','lx-card'); card.setAttribute('aria-busy',String(busyRoutine === routine.id));
          const top = el('div','lx-row'); top.append(icon('calendar'),el('h4','',routine.name));
          const enabled = keyed(el('button','lx-button',routine.enabled ? 'Enabled' : 'Paused'),`routine-toggle-${routine.id}`); enabled.type = 'button'; enabled.setAttribute('role','switch'); enabled.setAttribute('aria-checked',String(routine.enabled)); enabled.setAttribute('aria-label',`Enable ${routine.name}`);
          enabled.addEventListener('click',() => { routine.enabled = !routine.enabled; draw(); announce(`${routine.name} ${routine.enabled ? 'enabled' : 'paused'} in this demo.`); }); top.append(enabled);
          card.append(top,el('p','lx-muted',`${routine.cadence} · ${routine.time} · Another Me`),el('p','',routine.prompt));
          const actions = el('div','lx-toolbar'); const edit = keyed(button('Edit',() => { clearTimers(); editingId = routine.id; creating = false; draw(); focusKey('routine-name'); }),`routine-edit-${routine.id}`);
          edit.setAttribute('aria-label',`Edit ${routine.name}`);
          const running = busyRoutine === routine.id;
          const run = keyed(button(running ? 'Cancel example' : 'Run example',() => {
            if (busyRoutine === routine.id) { clearTimers(); draw(); announce('Routine example canceled.'); }
            else runRoutine(routine.id);
          }),`routine-run-${routine.id}`);
          run.setAttribute('aria-label',`${running ? 'Cancel' : 'Run'} ${routine.name} example`);
          actions.append(run,edit); card.append(actions);
          if (running) card.append(pill('Preparing example…'));
          if (state.routineResults[routine.id]) {
            const result = el('section','lx-detail lx-routine-result'); result.append(pill('Result'),el('p','',state.routineResults[routine.id])); card.append(result);
          }
          list.append(card);
        });
        page.append(list); focusKey(focus);
      }
      function runRoutine(id) {
        clearTimers(); const version = runVersion; busyRoutine = id; delete state.routineResults[id]; draw(); announce('Another Me is preparing a routine example.');
        later(() => {
          if (version !== runVersion || busyRoutine !== id) return;
          state.routineResults[id] = id === 'weekly' ? 'The launch plan is ready. Next week, confirm contract sign-off and review the revised proposal.' : 'Your first meeting is at 10. The revised proposal is due Friday; Alex is checking contract sign-off.';
          busyRoutine = null; draw(); announce('Routine example ready.');
        },api.reducedMotion() ? 0 : 1100);
      }
      function drawForm(page) {
        const original = state.routines.find(item => item.id === editingId);
        const draftKey = editingId || 'new';
        const draft = state.drafts.routines[draftKey] ||= {name:original?.name || '',prompt:original?.prompt || '',cadence:original?.cadence || 'Weekdays',time:original?.time || '08:30'};
        const form = el('form','lx-card lx-form'); form.append(el('h4','',original ? 'Edit routine' : 'Create a sample routine'));
        const name = keyed(input(draft.name,60),'routine-name'); name.required = true; name.placeholder = 'e.g. Morning brief';
        const prompt = editor(draft.prompt,3); prompt.required = true; prompt.placeholder = 'What should Another Me do?';
        const cadence = el('select'); ['Every day','Weekdays','Every week'].forEach(text => { const option = el('option','',text); option.value = text; cadence.append(option); }); cadence.value = draft.cadence;
        const time = el('input'); time.type = 'time'; time.required = true; time.value = draft.time;
        form.append(field('Name',name),field('Instructions',prompt)); const grid = el('div','lx-grid'); grid.append(field('Repeat',cadence),field('Time',time)); form.append(grid);
        const actions = el('div','lx-toolbar'); const save = button('Save in demo',() => {},true); save.type = 'submit';
        actions.append(save,button('Cancel',() => { delete state.drafts.routines[draftKey]; creating = false; editingId = null; draw(); focusKey(original ? `routine-edit-${original.id}` : 'new-routine'); })); form.append(actions);
        form.addEventListener('submit',event => {
          event.preventDefault();
          for (const node of [name,prompt]) { if (!node.value.trim()) { node.setCustomValidity('Enter a value.'); node.reportValidity(); return; } }
          const value = {name:name.value.trim(),prompt:prompt.value.trim(),cadence:cadence.value,time:time.value};
          const id = original?.id || `routine-${state.nextId++}`;
          if (original) Object.assign(original,value);
          else state.routines.push({...value,id,enabled:true});
          delete state.routineResults[id]; delete state.drafts.routines[draftKey];
          creating = false; editingId = null; draw(); focusKey(`routine-run-${id}`); announce('Routine saved in this demo. No schedule was created outside this page.');
        });
        [name,prompt].forEach(node => node.addEventListener('input',() => node.setCustomValidity('')));
        const rememberDraft = () => Object.assign(draft,{name:name.value,prompt:prompt.value,cadence:cadence.value,time:time.value});
        [name,prompt,cadence,time].forEach(node => { node.addEventListener('input',rememberDraft); node.addEventListener('change',rememberDraft); });
        page.append(form);
      }
      draw();
    }

    function computerView() {
      function draw() {
        if (state.runtime !== 'Pi') state.inference = 'Runtime provider';
        const page = heading('Computer');
        const card = el('article','lx-card');
        const runtime = el('section','lx-detail'); runtime.append(el('h4','','Agent runtime'),choose(['Pi','Codex','Claude Code'],state.runtime,value => {
          state.runtime = value;
          if (value !== 'Pi') state.inference = 'Runtime provider';
          api.onRuntimeChange?.(`${state.runtime} · ${state.inference}`); draw(); announce(`${value} with ${state.inference.toLowerCase()} selected in the configuration preview.`);
        },'Runtime preview'));
        const inference = el('section','lx-detail'); inference.append(el('h4','','Model source'));
        if (state.runtime === 'Pi') {
          inference.append(choose(['Local model','Runtime provider'],state.inference,value => { state.inference = value; api.onRuntimeChange?.(`${state.runtime} · ${state.inference}`); draw(); announce(`${value} selected in the configuration preview.`); },'Inference preview'));
        } else {
          inference.append(pill('Runtime provider'),el('p','lx-muted','The current local-model installer uses Pi.'));
        }
        card.append(runtime,inference);
        const summary = el('div','lx-detail');
        [['Connection','Not connected in this preview']].forEach(([label,value]) => { const row = el('div','lx-row'); row.append(el('span','lx-muted',label),el('strong','',value)); summary.append(row); });
        card.append(summary); page.append(card);
        const grid = el('div','lx-grid');
        [['Browser','Use your everyday browser and its signed-in apps.'],['Desktop','Work with local apps, files and windows.']].forEach(([title,text]) => { const item = el('article','lx-card'); item.append(icon('computer'),el('h4','',title),el('p','lx-muted',text)); grid.append(item); });
        page.append(grid,button('Open a task example',() => api.openChat('research'),true));
      }
      draw();
    }

    function agentsView() {
      let selected = state.agents.find(agent => agent.name === api.initialAgent)?.id || 'another-me';
      let tab = 'Profile';
      let creating = false;
      function draw() {
        const page = heading('Agents',creating ? null : keyed(button('New agent',() => { creating = true; draw(); focusKey('agent-name'); },true),'new-agent'));
        if (creating) { api.onAgentChange?.(null); drawForm(page); return; }
        const grid = el('div','lx-grid lx-grid--master-detail'); const list = el('nav','lx-card'); list.setAttribute('aria-label','Your agents'); const detail = el('article','lx-card lx-detail');
        state.agents.forEach(agent => list.append(listButton(agent.name,agent.role,agent.id === selected,() => { selected = agent.id; tab = 'Profile'; draw(); },'agent',agent.id)));
        const agent = state.agents.find(item => item.id === selected) || state.agents[0];
        api.onAgentChange?.(agent.id);
        const title = el('div','lx-row'); title.append(api.agentAvatar(agent.id) || el('span','lx-agent-avatar',agent.initial),el('h4','',agent.name)); detail.append(title);
        detail.append(choose(['Profile','Memory'],tab,value => { tab = value; draw(); },`${agent.name} profile tabs`));
        if (tab === 'Profile') {
          detail.append(textBlock('Instructions',agent.instructions));
          const skills = el('section','lx-detail'); skills.append(el('h4','','Skills')); const row = el('div','lx-toolbar'); agent.skills.forEach(skill => row.append(pill(skill))); skills.append(row); detail.append(skills);
          const connections = el('section','lx-detail'); connections.append(el('h4','','Tools'),button('Explore connected apps',() => api.openView('connectors'))); detail.append(connections);
          detail.append(button('Try this agent’s work',() => api.openChat(agent.scene),true));
        } else {
          detail.append(pill('This agent only'));
          if (agent.memory.length) {
            const ul = el('ul','lx-memory-list'); agent.memory.forEach(memory => ul.append(el('li','',memory))); detail.append(ul);
          } else detail.append(el('p','lx-muted','No learned memories in this sample agent yet.'));
          const wiki = el('section','lx-detail'); wiki.append(button('Open shared wiki',() => api.openView('wiki'))); detail.append(wiki);
        }
        grid.append(list,detail); page.append(grid);
      }
      function drawForm(page) {
        const draft = state.drafts.agent ||= {name:'',instructions:''};
        const form = el('form','lx-card lx-form'); form.append(el('h4','','Create a sample agent'));
        const name = keyed(input(draft.name,40),'agent-name'); name.required = true; name.placeholder = 'e.g. Project planner';
        const instructions = editor(draft.instructions,4); instructions.required = true; instructions.placeholder = 'Describe its role and how it should work.';
        form.append(field('Name',name),field('Instructions',instructions));
        const actions = el('div','lx-toolbar'); const save = button('Create in demo',() => {},true); save.type = 'submit'; actions.append(save,button('Cancel',() => { state.drafts.agent = null; creating = false; draw(); focusKey('new-agent'); })); form.append(actions);
        form.addEventListener('submit',event => {
          event.preventDefault();
          for (const node of [name,instructions]) { if (!node.value.trim()) { node.setCustomValidity('Enter a value.'); node.reportValidity(); return; } }
          const id = `agent-${state.nextId++}`;
          state.agents.push({id,name:name.value.trim(),role:'Custom sample agent',initial:Array.from(name.value.trim())[0].toUpperCase(),instructions:instructions.value.trim(),skills:['Shared context','Task delegation'],memory:[],scene:'research'});
          state.drafts.agent = null; selected = id; creating = false; tab = 'Profile'; draw(); host.querySelector('.lx-list-button[aria-pressed="true"]')?.focus({preventScroll:true}); announce(`${name.value.trim()} created in this demo.`);
        });
        [name,instructions].forEach(node => node.addEventListener('input',() => { node.setCustomValidity(''); Object.assign(draft,{name:name.value,instructions:instructions.value}); })); page.append(form);
      }
      draw();
    }

    const views = {wiki:wikiView,connectors:connectorsView,routines:routinesView,computer:computerView,agents:agentsView};
    if (views[view]) views[view]();
    else heading('Choose a workspace view');
    return cleanup;
  }

  window.LingerExplorer = {
    render,
    reset() { activeCleanup?.(); state = makeState(); }
  };
})();
