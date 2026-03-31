// ==UserScript==
// @name         DuckDuckGo — Wide layout
// @namespace    https://github.com/fluxtendu/My-userscripts
// @version      1.0.0
// @description  Widens the DDG results column and sidebar to make better use of screen space.
// @author       fluxtendu
// @match        https://duckduckgo.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // Adjust to taste
    const RESULTS_WIDTH = '980px';
    const SIDEBAR_WIDTH = '500px';

    function applyWideLayout() {
        // DDG renders two nested [data-testid="mainline"] sections — target both
        document.querySelectorAll('[data-testid="mainline"]').forEach(el => {
            el.style.setProperty('max-width', RESULTS_WIDTH, 'important');
        });

        const sidebar = document.querySelector('[data-testid="sidebar"]');
        if (sidebar) sidebar.style.setProperty('max-width', SIDEBAR_WIDTH, 'important');

        const header = document.querySelector('.header__search-wrap');
        if (header) header.style.setProperty('max-width', `calc(${RESULTS_WIDTH} + 18px)`, 'important');
    }

    new MutationObserver(applyWideLayout).observe(document.body, {
        childList: true,
        subtree: true,
    });

    applyWideLayout();
})();
