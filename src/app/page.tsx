import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-rimbun-bg flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full flex flex-col items-center">
        <Image
          src="/logo.png"
          alt="Rimbun Logo"
          width={200}
          height={100}
          priority
          className="h-auto w-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-rimbun-teal">
          Live Slot Booking System
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          Plan • Book • Go Live • Grow Together
        </p>
        <div className="mt-6 w-full py-2 px-4 bg-rimbun-lightTeal text-rimbun-teal font-medium rounded-lg text-xs">
          Phase 1 Setup Complete
        </div>
      </div>
    </main>
  );
}