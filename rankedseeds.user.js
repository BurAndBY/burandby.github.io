// ==UserScript==
// @name         MCSR Ranked Seeds + Variations
// @namespace    https://mcsrranked.com/
// @version      0.1.0
// @description  Show replay seeds and seed variations on match pages.
// @match        https://mcsrranked.com/stats/*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @connect      mcsrranked.com
// @connect      d3mfy0kz8mefbn.cloudfront.net
// @require      https://unpkg.com/fflate@0.8.2/umd/index.js
// ==/UserScript==

/* global GM_xmlhttpRequest, fflate */

(function () {
  'use strict';

  const REPLAY_BASE = 'https://d3mfy0kz8mefbn.cloudfront.net/';
  const API_BASE = 'https://mcsrranked.com/api/matches/';

  const style = document.createElement('style');
  style.textContent = `
    #mcsr-seed-panel {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      width: 320px;
      background: #101316;
      color: #e7e7e7;
      border: 1px solid #2a2f36;
      border-radius: 10px;
      padding: 12px;
      font: 12px/1.4 "Segoe UI", Tahoma, sans-serif;
      box-shadow: 0 6px 18px rgba(0,0,0,0.35);
    }
    #mcsr-seed-panel .mcsr-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    #mcsr-seed-panel .mcsr-title {
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    #mcsr-seed-panel .mcsr-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 4px;
      margin: 6px 0;
    }
    #mcsr-seed-panel .mcsr-kv {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 6px;
      margin: 4px 0;
      align-items: baseline;
    }
    #mcsr-seed-panel label {
      color: #9aa4b2;
    }
    #mcsr-seed-panel input {
      width: 100%;
      padding: 4px 6px;
      border-radius: 6px;
      border: 1px solid #2a2f36;
      background: #0b0e11;
      color: #e7e7e7;
    }
    #mcsr-seed-panel button {
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #2a2f36;
      background: #1a1f25;
      color: #e7e7e7;
      cursor: pointer;
    }
    #mcsr-seed-panel .mcsr-list {
      margin: 4px 0 0 0;
      padding-left: 16px;
    }
    #mcsr-seed-panel .mcsr-status {
      color: #c7d2e0;
      font-style: italic;
    }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'mcsr-seed-panel';
  panel.innerHTML = `
    <div class="mcsr-header">
      <div class="mcsr-title">MCSR Ranked Seeds</div>
      <button data-action="reload">Reload</button>
    </div>

    <div class="mcsr-row">
      <label>Match ID</label>
      <div style="display:flex; gap:6px;">
        <input type="text" data-input="matchId" placeholder="Enter match id" />
        <button data-action="load">Load</button>
      </div>
    </div>

    <div class="mcsr-kv"><label>Status</label><div class="mcsr-status" data-value="status">Idle</div></div>

    <div class="mcsr-kv"><label>Seed ID</label><div data-value="seedId">-</div></div>
    <div class="mcsr-kv"><label>Overworld Type</label><div data-value="overworldType">-</div></div>
    <div class="mcsr-kv"><label>Nether Type</label><div data-value="netherType">-</div></div>
    <div class="mcsr-kv"><label>End Towers</label><div data-value="endTowers">-</div></div>

    <div class="mcsr-kv"><label>Overworld Seed</label><div data-value="overworldSeed">-</div></div>
    <div class="mcsr-kv"><label>Nether Seed</label><div data-value="netherSeed">-</div></div>
    <div class="mcsr-kv"><label>End Seed</label><div data-value="endSeed">-</div></div>

    <div class="mcsr-row">
      <label>Variations</label>
      <ul class="mcsr-list" data-list="variations"></ul>
    </div>
  `;
  document.body.appendChild(panel);

  const el = {
    matchIdInput: panel.querySelector('[data-input="matchId"]'),
    status: panel.querySelector('[data-value="status"]'),
    seedId: panel.querySelector('[data-value="seedId"]'),
    overworldType: panel.querySelector('[data-value="overworldType"]'),
    netherType: panel.querySelector('[data-value="netherType"]'),
    endTowers: panel.querySelector('[data-value="endTowers"]'),
    overworldSeed: panel.querySelector('[data-value="overworldSeed"]'),
    netherSeed: panel.querySelector('[data-value="netherSeed"]'),
    endSeed: panel.querySelector('[data-value="endSeed"]'),
    variations: panel.querySelector('[data-list="variations"]')
  };

  function setText(target, value) {
    target.textContent = value == null || value === '' ? '-' : String(value);
  }

  function setStatus(text) {
    el.status.textContent = text;
  }

  function setList(listEl, items) {
    listEl.textContent = '';
    if (!items || !items.length) {
      const li = document.createElement('li');
      li.textContent = '-';
      listEl.appendChild(li);
      return;
    }
    items.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      listEl.appendChild(li);
    });
  }

  function getMatchIdFromUrl() {
    const match = location.pathname.match(/\/matches?\/(\d+)/i);
    if (match) {
      return match[1];
    }
    const statsMatch = location.pathname.match(/\/stats\/[^/]+\/(\d+)/i);
    return statsMatch ? statsMatch[1] : '';
  }

  function gmRequest(url, responseType) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        responseType,
        onload: (res) => resolve(res),
        onerror: (err) => reject(err),
        ontimeout: () => reject(new Error('Request timed out'))
      });
    });
  }

  async function loadMatch(matchId) {
    if (!matchId) {
      setStatus('Missing match id');
      return;
    }

    setStatus('Loading match data...');
    setText(el.seedId, '-');
    setText(el.overworldType, '-');
    setText(el.netherType, '-');
    setText(el.endTowers, '-');
    setText(el.overworldSeed, '-');
    setText(el.netherSeed, '-');
    setText(el.endSeed, '-');
    setList(el.variations, []);

    try {
      const apiRes = await gmRequest(API_BASE + matchId, 'text');
      const apiText = apiRes.responseText || apiRes.response;
      const apiJson = JSON.parse(apiText);
      const seed = apiJson && apiJson.data && apiJson.data.seed;

      if (seed) {
        setText(el.seedId, seed.id);
        setText(el.overworldType, seed.overworld);
        setText(el.netherType, seed.nether);
        setText(el.endTowers, Array.isArray(seed.endTowers) ? seed.endTowers.join(', ') : '-');
        setList(el.variations, seed.variations || []);
      }
    } catch (err) {
      setStatus('Match API failed: ' + (err && err.message ? err.message : 'unknown'));
    }

    try {
      setStatus('Downloading replay...');
      const replayRes = await gmRequest(REPLAY_BASE + matchId, 'arraybuffer');
      if (replayRes.status !== 200) {
        setStatus('Replay not available (HTTP ' + replayRes.status + ')');
        return;
      }

      const bytes = new Uint8Array(replayRes.response);
      const files = fflate.unzipSync(bytes);
      const metaKey = Object.keys(files).find((k) => k.endsWith('meta.json'));
      if (!metaKey) {
        setStatus('meta.json not found in replay');
        return;
      }

      const metaText = new TextDecoder('utf-8').decode(files[metaKey]);
      const meta = JSON.parse(metaText);

      setText(el.overworldSeed, meta.overworldSeed);
      setText(el.netherSeed, meta.netherSeed);
      setText(el.endSeed, meta.theEndSeed || meta.overworldSeed);
      setStatus('Done');
    } catch (err) {
      setStatus('Replay failed: ' + (err && err.message ? err.message : 'unknown'));
    }
  }

  panel.querySelector('[data-action="load"]').addEventListener('click', () => {
    loadMatch(el.matchIdInput.value.trim());
  });

  panel.querySelector('[data-action="reload"]').addEventListener('click', () => {
    const currentId = el.matchIdInput.value.trim();
    loadMatch(currentId || getMatchIdFromUrl());
  });

  const matchId = getMatchIdFromUrl();
  if (matchId) {
    el.matchIdInput.value = matchId;
    loadMatch(matchId);
  } else {
    setStatus('Enter a match id');
  }

  let lastUrl = location.href;
  setInterval(() => {
    if (location.href === lastUrl) {
      return;
    }
    lastUrl = location.href;
    const newId = getMatchIdFromUrl();
    if (newId && newId !== el.matchIdInput.value.trim()) {
      el.matchIdInput.value = newId;
      loadMatch(newId);
    }
  }, 1000);
})();
