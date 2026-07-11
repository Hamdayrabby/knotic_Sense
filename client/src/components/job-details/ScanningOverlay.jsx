import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const MotionDiv = motion.div;
const MotionP = motion.p;

const ScanningOverlay = () => (
    <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-knotic-bg/80 backdrop-blur-sm"
    >
        <div className="relative">
            <MotionDiv
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-knotic-accent border-t-transparent rounded-full"
            />
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-knotic-accent" />
        </div>
        <MotionP
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mt-4 text-knotic-accent font-medium tracking-wider"
        >
            ANALYZING RESUME MATCH...
        </MotionP>
    </MotionDiv>
);

export default ScanningOverlay;
