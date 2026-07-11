import { User as UserIcon, Mail, Phone, Link as LinkIcon } from 'lucide-react';

const CandidateProfile = ({ candidate }) => {
    return (
        <div className="bg-knotic-card border border-knotic-border rounded-xl p-6">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-knotic-accent to-purple-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                    {candidate?.name?.charAt(0) || <UserIcon />}
                </div>
                <div className="min-w-0">
                    <h2 className="text-xl font-bold text-white truncate">{candidate?.name || 'Unknown Candidate'}</h2>
                    <p className="text-sm text-knotic-muted">Parsed Profile</p>
                </div>
            </div>

            <div className="space-y-3 text-sm">
                {candidate?.email && (
                    <div className="flex items-center gap-3 text-knotic-text">
                        <Mail className="w-4 h-4 text-knotic-muted flex-shrink-0" />
                        <span className="truncate">{candidate.email}</span>
                    </div>
                )}
                {candidate?.phone && (
                    <div className="flex items-center gap-3 text-knotic-text">
                        <Phone className="w-4 h-4 text-knotic-muted flex-shrink-0" />
                        <span>{candidate.phone}</span>
                    </div>
                )}
                {candidate?.links?.map((link, i) => (
                    <div key={i} className="flex items-center gap-3 text-knotic-accent hover:underline overflow-hidden">
                        <LinkIcon className="w-4 h-4 text-knotic-muted flex-shrink-0" />
                        <a href={link} target="_blank" rel="noopener noreferrer" className="truncate">{link}</a>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CandidateProfile;
