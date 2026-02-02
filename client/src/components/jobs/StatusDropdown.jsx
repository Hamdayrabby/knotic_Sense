import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { statusConfig } from './StatusBadge';

const statuses = ['Interested', 'Applied', 'Interviewing', 'Offer', 'Rejected'];

const StatusDropdown = ({ currentStatus, onStatusChange, disabled = false, onClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef(null);

    // Calculate position when opening
    useEffect(() => {
        if (isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 8, // 8px gap
                left: rect.left
            });
        }
    }, [isOpen]);

    // Close on outside click and scroll
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target) && !e.target.closest('.status-dropdown-menu')) {
                setIsOpen(false);
            }
        };

        const handleScroll = () => {
            if (isOpen) setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    const handleSelect = (status) => {
        if (status !== currentStatus) {
            onStatusChange(status);
        }
        setIsOpen(false);
    };

    const config = statusConfig[currentStatus] || statusConfig.Interested;

    return (
        <div className="relative inline-block" ref={dropdownRef} onClick={onClick}>
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${config.bg} ${config.text} ${config.border} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'
                    }`}
            >
                <span className={`w-2 h-2 rounded-full ${config.dot}`} />
                {currentStatus}
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Portal Dropdown menu */}
            {isOpen && createPortal(
                <div
                    className="status-dropdown-menu fixed w-44 bg-knotic-card border border-knotic-border rounded-xl shadow-xl z-[9999] overflow-hidden"
                    style={{ top: coords.top, left: coords.left }}
                >
                    {statuses.map((status) => {
                        const statusConf = statusConfig[status];
                        const isSelected = status === currentStatus;

                        return (
                            <button
                                key={status}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(status);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${isSelected
                                    ? 'bg-knotic-accent/10 text-knotic-accent'
                                    : 'text-knotic-text hover:bg-knotic-border'
                                    }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${statusConf.dot}`} />
                                <span className="flex-1">{status}</span>
                                {isSelected && <Check className="w-4 h-4" />}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </div>
    );
};

export default StatusDropdown;
