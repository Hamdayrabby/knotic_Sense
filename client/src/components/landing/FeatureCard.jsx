import { createElement } from 'react';
import useInView from '../../hooks/useInView';

const FeatureCard = ({ icon, title, description, gradient, delay }) => {
    const [ref, isInView] = useInView();

    return (
        <div
            ref={ref}
            className={`landing-glass-card group p-8 rounded-2xl transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl ${isInView ? 'landing-fade-up' : 'opacity-0'}`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {createElement(icon, { className: 'w-7 h-7 text-white' })}
            </div>
            <h3 className="text-xl font-bold text-knotic-text mb-3">{title}</h3>
            <p className="text-knotic-muted leading-relaxed">{description}</p>
        </div>
    );
};

export default FeatureCard;
