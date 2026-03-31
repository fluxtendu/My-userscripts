// ==UserScript==
// @name         DuckDuckGo — Google tab
// @namespace    https://github.com/fluxtendu/My-userscripts
// @version      1.4.0
// @description  Adds a Google tab in the DDG filter bar. Context-aware: Images, Videos, News, Maps.
// @author       fluxtendu
// @match        https://duckduckgo.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    const STYLE = `
        li:has(#tm-google-tab)::after,
        li:has(#tm-google-tab)::before,
        #tm-google-tab::after,
        #tm-google-tab::before {
            display: none !important;
        }
        #tm-google-tab svg,
        #tm-google-maps-link svg {
            vertical-align: middle;
        }
        #tm-google-maps-link {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 16px;
            font-size: 14px;
            text-decoration: none;
            color: inherit;
            border-top: 1px solid rgba(128,128,128,0.2);
            cursor: pointer;
        }
        #tm-google-maps-link:hover {
            text-decoration: underline;
        }
    `;

    const EXTERNAL_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>`;

    const TBM = { images: 'isch', videos: 'vid', news: 'nws' };

    function getGoogleUrl(q) {
        const params = new URLSearchParams(window.location.search);
        const enc = encodeURIComponent(q);

        if (params.get('iaxm') === 'maps' || params.get('ia') === 'maps')
            return `https://www.google.com/maps/search/${enc}`;

        const tbm = TBM[params.get('ia')];
        return tbm
            ? `https://www.google.com/search?q=${enc}&tbm=${tbm}`
            : `https://www.google.com/search?q=${enc}`;
    }

    function openGoogle(e) {
        e.preventDefault();
        const q = document.querySelector('#search_form_input')?.value.trim();
        if (q) window.open(getGoogleUrl(q), '_blank', 'noopener');
    }

    // Watches a specific element and resets any class/aria-current changes DDG may apply
    function guardInactiveState(li, a) {
        const savedLiClass  = li.className;
        const savedAClass   = a.className;

        new MutationObserver(() => {
            if (a.hasAttribute('aria-current'))  a.removeAttribute('aria-current');
            if (li.hasAttribute('aria-current')) li.removeAttribute('aria-current');
            if (a.className  !== savedAClass)    a.className  = savedAClass;
            if (li.className !== savedLiClass)   li.className = savedLiClass;
        }).observe(li, {
            attributes: true,
            subtree: true,
            attributeFilter: ['aria-current', 'class'],
        });
    }

    function handleMapsView() {
        document.querySelector('#tm-google-tab')?.closest('li')?.remove();
        if (document.querySelector('#tm-google-maps-link')) return;

        const sidebar = document.querySelector('[data-testid="maps-vertical-sidebar-header"]');
        if (!sidebar) return;

        const link = document.createElement('a');
        link.id = 'tm-google-maps-link';
        link.href = '#';
        link.innerHTML = `${EXTERNAL_ICON} Open in Google Maps`;
        link.addEventListener('click', openGoogle);
        sidebar.appendChild(link);
    }

    function handleNormalView() {
        document.querySelector('#tm-google-maps-link')?.remove();

        const links = document.querySelectorAll('section > nav > ul:first-child > li > a');
        if (!links.length) return;

        const list = links[0].closest('ul');
        const existingTab = document.querySelector('#tm-google-tab');

        if (existingTab) {
            const tabItem = existingTab.closest('li');
            if (list.lastElementChild !== tabItem) list.appendChild(tabItem);
            return;
        }

        const source = [...links].find(
            a => !a.hasAttribute('aria-current') && !a.closest('li').hasAttribute('aria-current')
        ) ?? links[links.length - 1];

        const newItem = source.closest('li').cloneNode(true);
        const newLink = newItem.querySelector('a');

        newItem.querySelectorAll('[aria-current]').forEach(el => el.removeAttribute('aria-current'));
        newItem.removeAttribute('aria-current');

        newLink.id = 'tm-google-tab';
        newLink.innerHTML = `${EXTERNAL_ICON} Google`;
        newLink.href = '#';
        newLink.style.cursor = 'pointer';
        newLink.addEventListener('click', openGoogle);

        list.appendChild(newItem);
        guardInactiveState(newItem, newLink);
    }

    function run() {
        const onMaps = new URLSearchParams(window.location.search).get('iaxm') === 'maps';
        onMaps ? handleMapsView() : handleNormalView();
    }

    const style = document.createElement('style');
    style.id = 'tm-google-styles';
    style.textContent = STYLE;
    document.head.appendChild(style);

    new MutationObserver(run).observe(document.body, { childList: true, subtree: true });

    run();
})();
