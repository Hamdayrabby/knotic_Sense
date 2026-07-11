import { useState, useEffect } from 'react';

export const useTheme = () => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('knotic-theme') || 'system';
    });

    useEffect(() => {
        const root = document.documentElement;

        const applyTheme = () => {
            // Remove existing manual override classes
            root.classList.remove('light-mode', 'dark-mode');

            if (theme === 'system') {
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (systemPrefersDark) {
                    root.classList.add('dark-mode');
                } else {
                    root.classList.add('light-mode');
                }
            } else if (theme === 'dark') {
                root.classList.add('dark-mode');
            } else {
                root.classList.add('light-mode');
            }
        };

        applyTheme();
        localStorage.setItem('knotic-theme', theme);

        // Listen for system changes if system mode is active
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme();
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    return [theme, setTheme];
};
