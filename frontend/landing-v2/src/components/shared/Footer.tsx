export function Footer() {
	return (
		<footer className="border-t border-white/10 py-12 px-6 bg-black">
			<div className="max-w-7xl mx-auto">
				<div className="grid md:grid-cols-4 gap-8 mb-8">
					<div>
						<div className="mb-4">
							<img src="/LYNQ.png" alt="LYNQ" className="h-8 w-auto" />
						</div>
						<p className="text-gray-400 text-sm">
							Learn DeFi lending through interactive education and risk-free practice.
						</p>
					</div>

					<div>
						<h3 className="text-white font-semibold mb-4">Product</h3>
						<div className="space-y-2 text-sm text-gray-400">
							<a href="/learning" className="block hover:text-cyan-400 transition">
								Learning
							</a>
							<a href="/app" className="block hover:text-cyan-400 transition">
								Lending App
							</a>
							<a href="/#features" className="block hover:text-cyan-400 transition">
								Features
							</a>
						</div>
					</div>

					<div>
						<h3 className="text-white font-semibold mb-4">Resources</h3>
						<div className="space-y-2 text-sm text-gray-400">
							<a href="#" className="block hover:text-cyan-400 transition">
								Documentation
							</a>
							<a href="#" className="block hover:text-cyan-400 transition">
								API Reference
							</a>
							<a href="#" className="block hover:text-cyan-400 transition">
								Tutorials
							</a>
						</div>
					</div>

					<div>
						<h3 className="text-white font-semibold mb-4">Community</h3>
						<div className="space-y-2 text-sm text-gray-400">
							<a href="#" className="block hover:text-cyan-400 transition">
								Twitter
							</a>
							<a href="#" className="block hover:text-cyan-400 transition">
								Discord
							</a>
							<a href="#" className="block hover:text-cyan-400 transition">
								GitHub
							</a>
						</div>
					</div>
				</div>

				<div className="pt-8 border-t border-white/5 text-center text-gray-600 text-xs">
					© 2025 LYNQ. Built on Mantle. Audited by leading security firms.
				</div>
			</div>
		</footer>
	);
}
