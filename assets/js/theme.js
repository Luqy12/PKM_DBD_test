// theme.js - Dark Mode Toggle
(function () {
    'use strict';

    const THEME_KEY = 'pkm_dbd_theme';
    let currentTheme = 'light';

    // Initialize theme
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        // Load saved theme
        const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
        setTheme(savedTheme, false);

        // Create toggle button
        createToggleButton();
    }

    function createToggleButton() {
        // Check if button already exists
        if (document.getElementById('themeToggle')) return;

        // Create button
        const button = document.createElement('button');
        button.id = 'themeToggle';
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', 'Toggle dark mode');
        button.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
      .theme-toggle {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .theme-toggle:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }

      .theme-toggle:active {
        transform: scale(0.95);
      }

      [data-theme="dark"] {
        --bg-primary: #1a1a1a;
        --bg-secondary: #2d2d2d;
        --bg-tertiary: #3a3a3a;
        --text-primary: #f8f9fa;
        --text-secondary: #b8b9ba;
        --text-muted: #8c8d8e;
        --border-color: #444;
      }

      [data-theme="dark"] body {
        background: #1a1a1a;
        color: #f8f9fa;
      }

      [data-theme="dark"] .card,
      [data-theme="dark"] .metric-card,
      [data-theme="dark"] .chart-container,
      [data-theme="dark"] .activity-feed,
      [data-theme="dark"] .quiz-card,
      [data-theme="dark"] .reports-table-container,
      [data-theme="dark"] .leaderboard {
        background: #2d2d2d;
        color: #f8f9fa;
        border-color: #444;
      }

      [data-theme="dark"] .site-header {
        background: linear-gradient(135deg, #1e3a8a 0%, #3B82F6 100%);
      }

      [data-theme="dark"] .nav-link:hover {
        background: rgba(255,255,255,0.1);
      }

      [data-theme="dark"] .answer-option,
      [data-theme="dark"] .quick-stat {
        background: #3a3a3a;
        color: #f8f9fa;
      }

      [data-theme="dark"] .answer-option:hover {
        background: #454545;
      }

      [data-theme="dark"] input,
      [data-theme="dark"] textarea,
      [data-theme="dark"] select {
        background: #3a3a3a;
        color: #f8f9fa;
        border-color: #555;
      }

      [data-theme="dark"] .reports-table th {
        background: #3a3a3a;
        color: #f8f9fa;
      }

      [data-theme="dark"] .reports-table tr:hover {
        background: #3a3a3a;
      }

      [data-theme="dark"] .muted,
      [data-theme="dark"] .text-muted {
        color: #b8b9ba !important;
      }

      [data-theme="dark"] .site-footer {
        background: #1a1a1a;
        border-top-color: #444;
      }

      @media (max-width: 768px) {
        .theme-toggle {
          bottom: 1rem;
          right: 1rem;
          width: 48px;
          height: 48px;
          font-size: 1.25rem;
        }
      }
    `;
        document.head.appendChild(style);

        // Add click handler
        button.addEventListener('click', toggleTheme);

        // Append to body
        document.body.appendChild(button);
    }

    function toggleTheme() {
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme, true);
    }

    function setTheme(theme, save = true) {
        currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);

        // Update button icon
        const button = document.getElementById('themeToggle');
        if (button) {
            button.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        }

        // Save to localStorage
        if (save) {
            localStorage.setItem(THEME_KEY, theme);
        }

        // Add transition class
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    }

})();
