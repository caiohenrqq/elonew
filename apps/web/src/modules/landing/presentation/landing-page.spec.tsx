import { render, screen } from '@testing-library/react';
import { LandingPage } from './landing-page';

jest.mock('./sections/cta-section', () => ({
	CtaSection: () => <div data-testid="cta-section" />,
}));
jest.mock('./sections/hero-section', () => ({
	HeroSection: () => <div data-testid="hero-section" />,
}));
jest.mock('./sections/process-section', () => ({
	ProcessSection: () => <div data-testid="process-section" />,
}));
jest.mock('./sections/services-section', () => ({
	ServicesSection: () => <div data-testid="services-section" />,
}));

describe('LandingPage', () => {
	it('should render all sections', () => {
		render(<LandingPage />);

		expect(screen.getByTestId('hero-section')).toBeInTheDocument();
		expect(screen.getByTestId('services-section')).toBeInTheDocument();
		expect(screen.getByTestId('process-section')).toBeInTheDocument();
		expect(screen.getByTestId('cta-section')).toBeInTheDocument();
	});
});
