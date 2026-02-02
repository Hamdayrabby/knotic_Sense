import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-knotic-bg flex flex-col md:block">
            {/* Mobile Header */}
            <header className="md:hidden flex items-center p-4 border-b border-knotic-border bg-knotic-card sticky top-0 z-30">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 -ml-2 rounded-lg text-knotic-muted hover:bg-knotic-border hover:text-knotic-text"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <span className="ml-3 font-bold text-knotic-text">Knotic Sense</span>
            </header>

            {/* Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main content area */}
            <main className="flex-1 md:ml-64 min-h-screen p-4 md:p-8">
                <Outlet />
            </main>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default MainLayout;
