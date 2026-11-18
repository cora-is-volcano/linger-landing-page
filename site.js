(() => {
  const notes = [...document.querySelectorAll('.context-info')];
  document.addEventListener('click', event => {
    notes.forEach(note => { if (!note.contains(event.target)) note.open = false; });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    notes.forEach(note => {
      if (!note.open) return;
      const focused = note.contains(document.activeElement);
      note.open = false;
      if (focused) note.querySelector('summary').focus();
    });
  });
})();
(() => {
  const trigger=document.querySelector('.menu-trigger');
  const nav=document.querySelector('.main-nav');
  if(trigger&&nav){
    const desktop=matchMedia('(min-width:761px)');
    const firstLink=()=>nav.querySelector('a');
    const close=(restore=false)=>{
      const focused=document.activeElement;
      nav.classList.remove('is-open');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-label','Open navigation');
      if(restore||(nav.contains(focused)&&!focused.getClientRects().length)){
        (desktop.matches?firstLink():trigger)?.focus({preventScroll:true});
      }
    };
    trigger.addEventListener('click',event=>{
      const open=trigger.getAttribute('aria-expanded')!=='true';
      if(!open){close();return;}
      nav.classList.add('is-open');trigger.setAttribute('aria-expanded','true');trigger.setAttribute('aria-label','Close navigation');
      // Keyboard and assistive activation enter the menu; pointer clicks keep their focus behavior.
      if(event.detail===0)firstLink()?.focus({preventScroll:true});
    });
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',event=>{
      close();
      if(event.defaultPrevented||event.detail!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const href=a.getAttribute('href');
      const destination=href?.startsWith('#')?document.getElementById(href.slice(1)):null;
      if(destination){
        const heading=destination.querySelector('h1,h2')||destination;
        // Native fragment navigation runs after this click handler and can reset focus.
        requestAnimationFrame(()=>{heading.tabIndex=-1;heading.focus({preventScroll:true});});
      }
    }));
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('is-open'))close(true)});
    document.addEventListener('click',event=>{if(!nav.contains(event.target)&&!trigger.contains(event.target))close()});
    document.addEventListener('focusin',event=>{if(nav.classList.contains('is-open')&&!nav.contains(event.target)&&event.target!==trigger)close()});
    desktop.addEventListener('change',()=>{
      const focused=document.activeElement;close();
      if(desktop.matches&&focused===trigger)firstLink()?.focus({preventScroll:true});
    });
    document.querySelectorAll('.brand,.nav-download').forEach(a=>a.addEventListener('click',()=>close()));
  }
  const dialog=document.getElementById('overview-dialog');
  if(!dialog)return;
  const video=dialog.querySelector('video');const title=document.getElementById('overview-title');const source=document.getElementById('demo-source');const error=document.getElementById('demo-error');let opener;
  const demos={
    overview:{title:'Linger overview',file:'linger-overview'},
    teams:{title:'Agent teams',file:'platform-teams'},
    tasks:{title:'Background tasks',file:'platform-tasks'},
    memory:{title:'Wiki & memory',file:'platform-memory'},
    inference:{title:'PolyStrata local inference',file:'platform-inference'}
  };
  document.querySelectorAll('a[data-demo]').forEach(link=>link.addEventListener('click',event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||!dialog.showModal)return;
    const demo=demos[link.dataset.demo];if(!demo)return;event.preventDefault();opener=link;title.textContent=demo.title;video.poster=`./media/${demo.file}.webp`;video.src=`./media/${demo.file}.mp4`;video.setAttribute('aria-label',demo.title);source.href=video.src;error.hidden=true;dialog.showModal();video.load();video.play().catch(()=>{});
  }));
  document.getElementById('close-overview').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()});
  dialog.addEventListener('close',()=>{video.pause();video.removeAttribute('src');video.load();opener?.focus({preventScroll:true})});
  video.addEventListener('error',()=>{if(dialog.open&&video.error){error.textContent='This video could not play. Open the video in a new tab to try again.';error.hidden=false}});
})();
