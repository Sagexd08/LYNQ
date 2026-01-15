import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { LoadingPage } from '@/components/shared/LoadingPage';
import { HomeSection } from '@/components/landing/HomeSection';
import { ProductIntroSection } from '@/components/landing/ProductIntroSection';
import { CoreLoopSection } from '@/components/landing/CoreLoopSection';
import { LearningExperienceSection } from '@/components/landing/LearningExperienceSection';
import { ReputationSystemSection } from '@/components/landing/ReputationSystemSection';
import { LendingExperienceSection } from '@/components/landing/LendingExperienceSection';
import { SystemExplanationSection } from '@/components/landing/SystemExplanationSection';
import { NetworkSection } from '@/components/landing/NetworkSection';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { UserPersonasSection } from '@/components/landing/UserPersonasSection';
import { CTASection } from '@/components/landing/CTASection';

export default function LandingV2() {
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoading(false);
		}, 3000);

		return () => clearTimeout(timer);
	}, []);

	if (isLoading) {
		return <LoadingPage />;
	}

	return (
		<div className="bg-black text-white min-h-screen antialiased">
			<Header />
			<main className="overflow-hidden">
				{/* Hero: Learn DeFi. Build Reputation. Unlock Lending. */}
				<HomeSection />

				{/* What is LYNQ? */}
				<ProductIntroSection />

				{/* The Core Loop: Learn -> Build Reputation -> Unlock Lending */}
				<CoreLoopSection />

				{/* Learning Experience: Safe environment */}
				<LearningExperienceSection />

				{/* Reputation System: Tiers and Score Factors */}
				<ReputationSystemSection />

				{/* Lending Experience: Two pathways */}
				<LendingExperienceSection />

				{/* How LYNQ Works: Technical features */}
				<SystemExplanationSection />

				{/* Why Mantle */}
				<NetworkSection />

				{/* Security & Trust */}
				<SecuritySection />

				{/* Built for Everyone: User Personas */}
				<UserPersonasSection />

				{/* Final CTA */}
				<CTASection />
			</main>
			<Footer />
		</div>
	);
}
