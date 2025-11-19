export default function BuiltOnAptos() {
  return (
    <section
      id="built-on-aptos"
      className="py-12 sm:py-16 md:py-20 relative text-white max-w-4xl mx-auto px-4 sm:px-6 flex gap-4 flex-wrap md:flex-nowrap justify-center items-center"
    >
      <span className="relative flex items-center">
        {/* Brighter backlit gradient glow behind text */}
        <span className="absolute inset-0 rounded-full blur-3xl opacity-95 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-400 -z-10"></span>
        <span className="text-2xl sm:text-3xl md:text-4xl font-semibold whitespace-nowrap px-4">
          Built on
        </span>
      </span>
      <span className="relative flex items-center">
        {/* Brighter backlit gradient glow behind logo */}
        <span className="absolute inset-0 rounded-full blur-3xl opacity-95 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-400 -z-10"></span>
        <img
          src="/apo.png"
          alt="Aptos Logo"
          className="max-w-xs h-auto relative"
        />
      </span>
    </section>
  );
}
