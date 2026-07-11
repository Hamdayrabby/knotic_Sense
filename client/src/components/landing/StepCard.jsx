import { createElement } from 'react';
import useInView from '../../hooks/useInView';

const StepCard = ({ number, icon, title, description, delay }) => {
    const [ref, isInView] = useInView();

    return (
        <div
            ref={ref}
            className={`relative text-center ${isInView ? 'landing-fade-up' : 'opacity-0'}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            {/* Step number */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-knotic-accent text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-knotic-accent/30 z-10">
                {number}
            </div>
            <div className="landing-glass-card p-8 pt-10 rounded-2xl h-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-knotic-accent/20 to-purple-500/20 flex items-center justify-center mx-auto mb-5">
                    {createElement(icon, { className: 'w-8 h-8 text-knotic-accent' })}
                </div>
                <h3 className="text-lg font-bold text-knotic-text mb-2">{title}</h3>
                <p className="text-knotic-muted text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    );
};

export default StepCard;
