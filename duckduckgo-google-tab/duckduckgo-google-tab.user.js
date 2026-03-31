// ==UserScript==
// @name         DuckDuckGo — Google tab
// @namespace    https://github.com/fluxtendu/My-userscripts
// @version      1.1.0
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

    function getGoogleUrl(q) {
        const params = new URLSearchParams(window.location.search);
        const ia   = params.get('ia')   || '';
        const iaxm = params.get('iaxm') || '';
        const enc  = encodeURIComponent(q);

        if (iaxm === 'maps' || ia === 'maps')
            return `https://www.google.com/maps/search/${enc}`;

        switch (ia) {
            case 'images': return `https://www.google.com/search?q=${enc}&tbm=isch`;
            case 'videos': return `https://www.google.com/search?q=${enc}&tbm=vid`;
            case 'news':   return `https://www.google.com/search?q=${enc}&tbm=nws`;
            default:       return `https://www.google.com/search?q=${enc}`;
        }
    }

    function injectStyles() {
        if (document.querySelector('#tm-google-styles')) return;
        const style = document.createElement('style');
        style.id = 'tm-google-styles';
        style.textContent = STYLE;
        document.head.appendChild(style);
    }

    function run() {
        injectStyles();

        const input = document.querySelector('#search_form_input');
        if (!input) return;

        const onMaps = new URLSearchParams(window.location.search).get('iaxm') === 'maps';

        // --- Maps view: link in sidebar ---
        if (onMaps) {
            document.querySelector('#tm-google-tab')?.closest('li')?.remove();

            if (!document.querySelector('#tm-google-maps-link')) {
                const sidebar = document.querySelector('[data-testid="maps-vertical-sidebar-header"]');
                if (sidebar) {
                    const link = document.createElement('a');
                    link.id = 'tm-google-maps-link';
                    link.href = '#';
                    link.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        Open in Google Maps
                    `;
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const q = input.value.trim();
                        if (!q) return;
                        window.open(getGoogleUrl(q), '_blank', 'noopener');
                    });
                    sidebar.appendChild(link);
                }
            }
            return;
        }

        // --- Normal view: tab in nav ---
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

        const source = [...links].find(a => !a.hasAttribute('aria-current') && !a.closest('li').hasAttribute('aria-current'))
            ?? links[links.length - 1];

        const newItem = source.closest('li').cloneNode(true);
        const newLink = newItem.querySelector('a');

        newItem.querySelectorAll('[aria-current]').forEach(el => el.removeAttribute('aria-current'));
        newItem.removeAttribute('aria-current');

        newLink.id = 'tm-google-tab';
        newLink.textContent = 'Google ↗';
        newLink.href = '#';
        newLink.style.cursor = 'pointer';

        newLink.addEventListener('click', (e) => {
            e.preventDefault();
            const q = input.value.trim();
            if (!q) return;
            window.open(getGoogleUrl(q), '_blank', 'noopener');
        });

        list.appendChild(newItem);
    }

    const observer = new MutationObserver((mutations) => {
        // Prevent React from re-applying aria-current on our tab
        for (const mutation of mutations) {
            if (
                mutation.type === 'attributes' &&
                mutation.attributeName === 'aria-current' &&
                mutation.target.id === 'tm-google-tab'
            ) {
                mutation.target.removeAttribute('aria-current');
                return;
            }
        }
        run();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-current']
    });

    run();
})();
