import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { HomeSection } from '@/components/landing/HomeSection';
import { ProductIntroSection } from '@/components/landing/ProductIntroSection';
import { SystemExplanationSection } from '@/components/landing/SystemExplanationSection';
import { LearningPreviewSection } from '@/components/landing/LearningPreviewSection';
import { NetworkSection } from '@/components/landing/NetworkSection';
import { CTASection } from '@/components/landing/CTASection';

export default function LandingV2() {
	return (
		<div className="bg-black text-white min-h-screen">
			<Header />
			<main className="overflow-hidden">
				<HomeSection />
				<ProductIntroSection />
				<SystemExplanationSection />
				<LearningPreviewSection />
				<NetworkSection />
				<CTASection />
			</main>
			<Footer />
		</div>
	);
}
