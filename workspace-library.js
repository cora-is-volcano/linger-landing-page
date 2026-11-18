/* Local Library and Meetings examples, based on Linger's document/recording surfaces. */
(() => {
  'use strict';

  const initialDraft = 'Hi Alex,\n\nThe launch plan is ready. Could you confirm who will review the contract and whether we can get sign-off by Friday?\n\nOnce that is confirmed, we can finalize the launch brief.\n\nThanks!';
  const initialDocuments = [
    {
      id: 'brief', title: 'Acme launch brief', kind: 'Project brief',
      body: '# Acme launch\n\nThe launch plan is ready. Contract sign-off is the remaining decision.\n\n## Next steps\n\n- Alex: confirm the contract reviewer.\n- You: share the revised proposal by Friday.\n- Writer: prepare the follow-up for your review.\n\n## Sources\n\nWeekly sync · Project wiki · Email from Alex',
    },
    { id: 'followup', title: 'Contract follow-up', kind: 'Email draft', body: initialDraft },
    {
      id: 'team', title: 'team.md', kind: 'Shared plan',
      body: '# Acme launch team\n\n## Goal\n\nPrepare a launch brief with a clear owner for every open decision.\n\n## Another Me · Coordinator\n\nBring the findings together and return the finished draft for review.\n\n## Research\n\nCheck the project wiki, meeting notes and email. Report the contract-review owner and open questions.\n\n## Writer\n\nUse the shared findings to draft a concise follow-up. Keep the draft unsent for human review.',
    },
  ];
  const transcript = [
    { speaker: 'Alex', time: '00:06', text: 'The launch plan is ready. We still need a contract reviewer.' },
    { speaker: 'You', time: '00:18', text: 'I’ll share the revised proposal by Friday.' },
    { speaker: 'Maya', time: '00:31', text: 'Let’s ask Alex to confirm who can sign off.' },
  ];

  const freshState = () => ({
    tab: 'documents', selected: 'brief',
    documents: Object.fromEntries(initialDocuments.map(doc => [doc.id, { ...doc, buffer: doc.body, editing: false }])),
  });
  let state = freshState();
  let sequence = 0;
  let mounted = null;

  function node(tag, className, text) {
    const result = document.createElement(tag);
    if (className) result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  }
  function action(text, className = 'lx-button') {
    const button = node('button', className, text);
    button.type = 'button';
    return button;
  }

  function render(host, api) {
    mounted?.cleanup();
    if (api.initialTab === 'documents' || api.initialTab === 'meetings') state.tab = api.initialTab;
    if (Object.hasOwn(state.documents, api.initialDocument)) state.selected = api.initialDocument;
    const prefix = `lx-library-${++sequence}`;
    let alive = true;
    let runId = 0;
    let timers = [];
    let recording = false;
    let phase = 3;
    let meetingNodes = null;
    const root = node('div', 'lx-page lx-library');
    const header = node('div', 'lx-page-head');
    header.append(node('h3', '', 'Library'));
    const tabs = node('div', 'lx-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Library views');
    const content = node('div', 'lx-library-content');
    root.append(header, tabs, content);
    host.replaceChildren(root);

    function icon(name) {
      const glyph = api.icon(name);
      glyph.setAttribute('aria-hidden', 'true');
      return glyph;
    }
    function notify(message) { if (alive) api.announce(message); }
    function stopTimers() {
      runId += 1;
      timers.forEach(clearTimeout);
      timers = [];
      recording = false;
    }
    function finishRecording(announce = true) {
      stopTimers();
      phase = 3;
      updateRecording();
      if (announce) notify('Sample meeting notes are ready.');
    }
    function later(callback, delay, token) {
      timers.push(setTimeout(() => {
        if (!alive || token !== runId) return;
        if (api.reducedMotion()) { finishRecording(false); return; }
        callback();
      }, delay));
    }
    function replay() {
      if (recording) { finishRecording(); return; }
      if (api.reducedMotion()) { finishRecording(); return; }
      stopTimers();
      recording = true;
      phase = 0;
      const token = runId;
      updateRecording();
      notify('Playing a fixed meeting example.');
      later(() => { phase = 1; updateRecording(); }, 850, token);
      later(() => { phase = 2; updateRecording(); }, 1700, token);
      later(() => finishRecording(), 2850, token);
    }
    function updateRecording() {
      if (!alive || !meetingNodes) return;
      const { surface, replayButton, replayLabel, timer, status, lines, notesBody, pending, draftButton } = meetingNodes;
      surface.dataset.playing = String(recording);
      surface.dataset.step = String(phase);
      surface.setAttribute('aria-busy', String(recording));
      replayLabel.textContent = recording ? 'Show result' : 'Replay recording';
      replayButton.setAttribute('aria-label', replayLabel.textContent);
      timer.textContent = ['00:06', '00:18', '00:31', '00:42'][phase];
      status.textContent = phase === 3 ? 'Captured' : phase === 2 ? 'Preparing notes' : 'Recording example';
      lines.forEach((line, index) => {
        const shown = phase >= index;
        line.classList.toggle('is-visible', shown);
        line.style.visibility = shown ? 'visible' : 'hidden';
        line.setAttribute('aria-hidden', String(!shown));
      });
      notesBody.hidden = phase !== 3;
      pending.hidden = phase === 3;
      draftButton.disabled = phase !== 3;
    }
    function onHidden() { if (document.hidden && recording) finishRecording(false); }
    document.addEventListener('visibilitychange', onHidden);

    const tabButtons = ['documents', 'meetings'].map((key, index, keys) => {
      const button = action(key === 'documents' ? 'Documents' : 'Meetings', '');
      button.id = `${prefix}-tab-${key}`;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', `${prefix}-panel`);
      button.addEventListener('click', () => openTab(key));
      button.addEventListener('keydown', event => {
        const next = { ArrowRight: (index + 1) % keys.length, ArrowLeft: (index + keys.length - 1) % keys.length, Home: 0, End: keys.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        openTab(keys[next]);
        tabButtons[next].focus({ preventScroll: true });
      });
      tabs.append(button);
      return button;
    });
    content.id = `${prefix}-panel`;
    content.setAttribute('role', 'tabpanel');
    content.tabIndex = 0;

    function openTab(key) {
      if (!alive) return;
      stopTimers();
      phase = 3;
      state.tab = key;
      draw();
    }
    function draw() {
      if (!alive) return;
      tabButtons.forEach((button, index) => {
        const selected = (index === 0 ? 'documents' : 'meetings') === state.tab;
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
      });
      content.setAttribute('aria-labelledby', `${prefix}-tab-${state.tab}`);
      content.replaceChildren();
      meetingNodes = null;
      if (state.tab === 'documents') drawDocuments();
      else drawMeetings();
    }
    function drawDocuments() {
      const layout = node('div', 'lx-library-grid');
      const list = node('div', 'lx-library-list');
      list.setAttribute('aria-label', 'Example documents');
      const reader = node('article', 'lx-detail lx-library-reader');
      const doc = state.documents[state.selected];
      Object.values(state.documents).forEach(item => {
        const button = action('', 'lx-list-button lx-library-file');
        button.setAttribute('aria-pressed', String(item.id === state.selected));
        button.dataset.documentId = item.id;
        const copy = node('span');
        copy.append(node('strong', '', item.title), node('small', 'lx-muted', item.kind));
        button.append(icon('file'), copy);
        const marker = node('span', 'lx-unsaved-dot');
        marker.append(node('span', 'sr-only', 'Unsaved changes'));
        marker.hidden = item.buffer === item.body;
        button.append(marker);
        button.addEventListener('click', () => {
          state.selected = item.id;
          draw();
          content.querySelector(`[data-document-id="${item.id}"]`)?.focus({ preventScroll: true });
        });
        list.append(button);
      });
      const top = node('div', 'lx-toolbar lx-library-docbar');
      const heading = node('div');
      heading.append(node('h4', '', doc.title));
      const controls = node('div', 'lx-library-actions');
      const download = action('', 'lx-button lx-library-download');
      download.setAttribute('aria-label', `Download ${doc.title}`);
      download.append(icon('download'), node('span', '', 'Download'));
      download.addEventListener('click', () => downloadDocument(doc));
      if (doc.editing) {
        const save = action('Save changes', 'lx-button lx-button--primary');
        save.addEventListener('click', () => {
          if (!doc.buffer.trim()) {
            const field = reader.querySelector('textarea');
            field.setCustomValidity('Add text before saving.');
            field.reportValidity();
            return;
          }
          doc.body = doc.buffer.trim();
          doc.buffer = doc.body;
          doc.editing = false;
          draw();
          content.querySelector('[data-library-edit]')?.focus({ preventScroll: true });
          notify('Document saved in this demo.');
        });
        const cancel = action('Cancel');
        cancel.addEventListener('click', () => {
          doc.buffer = doc.body;
          doc.editing = false;
          draw();
          content.querySelector('[data-library-edit]')?.focus({ preventScroll: true });
          notify('Changes discarded.');
        });
        controls.append(save, cancel, download);
      } else {
        const edit = action('Edit', 'lx-button lx-button--primary');
        edit.dataset.libraryEdit = '';
        edit.addEventListener('click', () => {
          doc.editing = true;
          draw();
          content.querySelector('textarea')?.focus({ preventScroll: true });
        });
        controls.append(edit, download);
      }
      top.append(heading, controls);
      reader.append(top);
      if (doc.editing) {
        const label = node('label', 'sr-only', `Edit ${doc.title}`);
        const editor = node('textarea', 'lx-editor lx-library-editor');
        editor.id = `${prefix}-editor-${doc.id}`;
        label.htmlFor = editor.id;
        editor.value = doc.buffer;
        editor.maxLength = 12000;
        editor.rows = 13;
        editor.spellcheck = false;
        const changes = node('span', 'lx-muted lx-library-save-state', doc.buffer !== doc.body ? 'Unsaved changes' : 'Saved');
        editor.addEventListener('input', () => {
          doc.buffer = editor.value;
          editor.setCustomValidity('');
          changes.textContent = doc.buffer !== doc.body ? 'Unsaved changes' : 'Saved';
          const marker = list.querySelector(`[data-document-id="${doc.id}"] .lx-unsaved-dot`);
          if (marker) marker.hidden = doc.buffer === doc.body;
        });
        reader.append(label, editor, changes);
      } else {
        const body = node('div', 'lx-library-document');
        body.setAttribute('aria-label', `${doc.title} content`);
        doc.buffer.split(/\n\n+/).forEach(block => {
          if (block.startsWith('# ')) body.append(node('h4', '', block.slice(2)));
          else if (block.startsWith('## ')) body.append(node('h5', '', block.slice(3)));
          else if (block.startsWith('- ')) {
            const list = node('ul');
            block.split('\n').forEach(line => list.append(node('li', '', line.replace(/^- /, ''))));
            body.append(list);
          } else body.append(node('p', '', block));
        });
        reader.append(body);
      }
      layout.append(list, reader);
      content.append(layout);
    }
    function downloadDocument(doc) {
      const text = `${doc.buffer}\n\n---\nLinger interactive demo · Sample data\n`;
      const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
      const link = node('a');
      link.href = url;
      link.download = doc.id === 'team' ? 'team.md' : `linger-${doc.id}.md`;
      link.hidden = true;
      root.append(link);
      link.click();
      link.remove();
      // The URL outlives this view briefly, so a navigation does not interrupt the download.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify('Sample document downloaded.');
    }
    function drawMeetings() {
      const surface = node('div', 'lx-meetings');
      const toolbar = node('div', 'lx-toolbar lx-meeting-toolbar');
      const title = node('div');
      title.append(node('h4', '', 'Acme weekly sync'));
      const replayButton = action('', 'lx-button');
      const replayLabel = node('span', '', 'Replay recording');
      replayButton.append(icon('play'), replayLabel);
      replayButton.addEventListener('click', replay);
      toolbar.append(title, replayButton);
      const grid = node('div', 'lx-grid lx-meeting-grid');
      const recordingCard = node('article', 'lx-card lx-meeting-recording');
      const recordingHead = node('div', 'lx-row lx-meeting-status');
      const status = node('span', '', 'Captured');
      const timer = node('time', '', '00:42');
      recordingHead.append(icon('mic'), status, timer);
      const wave = node('div', 'lx-meeting-wave');
      wave.setAttribute('aria-hidden', 'true');
      const heights = [8, 16, 30, 20, 42, 28, 16, 36, 48, 26, 40, 18, 30, 48, 22, 14, 32, 24, 16, 8];
      heights.forEach((height, index) => {
        const bar = node('i');
        bar.style.setProperty('--sample-height', `${height}px`);
        bar.style.setProperty('--sample-delay', `${index % 5 * 80}ms`);
        wave.append(bar);
      });
      const transcriptList = node('ol', 'lx-meeting-transcript');
      const lines = transcript.map(item => {
        const line = node('li', 'lx-meeting-line is-visible');
        const label = node('div', 'lx-row');
        label.append(node('strong', '', item.speaker), node('time', 'lx-muted', item.time));
        line.append(label, node('p', '', item.text));
        transcriptList.append(line);
        return line;
      });
      recordingCard.append(recordingHead, wave, transcriptList);
      const notes = node('article', 'lx-card lx-meeting-notes');
      const notesHeading = node('div', 'lx-row');
      notesHeading.append(icon('file'), node('h4', '', 'Meeting notes'));
      const notesBody = node('div', 'lx-meeting-notes-body');
      notesBody.append(node('p', '', 'Launch plan ready. Contract reviewer to be confirmed.'));
      const tasks = node('ul', 'lx-meeting-tasks');
      [['Share revised proposal', 'You · Friday'], ['Confirm contract reviewer', 'Alex']].forEach(([task, owner]) => {
        const item = node('li');
        const copy = node('div');
        copy.append(node('strong', '', task), node('span', 'lx-muted', owner));
        item.append(icon('check'), copy);
        tasks.append(item);
      });
      notesBody.append(tasks);
      const pending = node('div', 'lx-meeting-pending');
      pending.setAttribute('aria-hidden', 'true');
      for (let index = 0; index < 4; index += 1) pending.append(node('i'));
      pending.hidden = true;
      const draftButton = action('Draft follow-up', 'lx-button lx-button--primary');
      draftButton.append(icon('arrow'));
      draftButton.addEventListener('click', () => api.openChat('followup'));
      notes.append(notesHeading, notesBody, pending, draftButton);
      grid.append(recordingCard, notes);
      surface.append(toolbar, grid);
      content.append(surface);
      meetingNodes = { surface, replayButton, replayLabel, timer, status, lines, notesBody, pending, draftButton };
      updateRecording();
    }

    const cleanup = () => {
      if (!alive) return;
      stopTimers();
      alive = false;
      document.removeEventListener('visibilitychange', onHidden);
      if (mounted?.cleanup === cleanup) mounted = null;
    };
    mounted = { cleanup, refresh: () => { stopTimers(); phase = 3; draw(); } };
    draw();
    return cleanup;
  }

  window.LingerLibrary = {
    render,
    reset() { state = freshState(); mounted?.refresh(); },
    getDraft() { return state.documents.followup.body; },
    setDraft(text) {
      if (typeof text !== 'string') return;
      const draft = state.documents.followup;
      draft.body = text.slice(0, 12000);
      draft.buffer = draft.body;
      draft.editing = false;
      mounted?.refresh();
    },
  };
})();
