'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

type WizardStepTransitionProps = {
	children: ReactNode;
	stepKey: string;
};

export const WizardStepTransition = ({
	children,
	stepKey,
}: WizardStepTransitionProps) => (
	<motion.div
		key={stepKey}
		initial={{ opacity: 0, x: 20 }}
		animate={{ opacity: 1, x: 0 }}
		exit={{ opacity: 0, x: -20 }}
	>
		{children}
	</motion.div>
);
