import Link from "next/link";
import { Header } from "@/components/layout/Header";

export default function Home() {
  return (
    <div>
      <Header />
      {/* Hero Section */}
      <section className="hero min-h-screen relative overflow-hidden">
        {/* Background gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1a365d 0%, #2d5a87 50%, #4a90b8 100%)'
          }}
        />
        
        {/* Decorative pattern */}
        <div 
          className="absolute top-0 -right-1/5 w-3/5 h-full opacity-30"
          style={{
            backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><circle cx="200" cy="200" r="3" fill="rgba(255,255,255,0.1)"/><circle cx="400" cy="100" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="600" cy="300" r="4" fill="rgba(255,255,255,0.1)"/><circle cx="800" cy="150" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="300" cy="400" r="3" fill="rgba(255,255,255,0.1)"/><circle cx="700" cy="500" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="500" cy="600" r="3" fill="rgba(255,255,255,0.1)"/><circle cx="100" cy="700" r="4" fill="rgba(255,255,255,0.1)"/><circle cx="900" cy="800" r="2" fill="rgba(255,255,255,0.1)"/></svg>')`,
            backgroundRepeat: 'repeat'
          }}
        />

        <div className="container relative z-10 max-w-6xl mx-auto px-5 flex items-center min-h-screen">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-15 items-center w-full">
            {/* Hero Text */}
            <div className="text-white">
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Find Your Tennis Community
              </h1>
              <p className="text-xl lg:text-2xl mb-8 opacity-90 font-light">
                Competitive tournaments. Local leagues. Real connections.
              </p>
              <p className="text-lg mb-10 opacity-80 leading-relaxed">
                Join San Francisco&apos;s premier tennis community where 4.0+ players compete, 
                connect, and elevate their game through organized tournaments and social events.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-5 mb-10">
                <Link 
                  href="/auth/signup"
                  className="inline-block px-8 py-4 rounded-full text-lg font-semibold text-white text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
                  style={{
                    background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
                    boxShadow: '0 8px 25px rgba(255, 107, 53, 0.3)'
                  }}
                >
                  Join the Community
                </Link>
                <Link 
                  href="/events/create"
                  className="btn-secondary inline-block px-8 py-4 rounded-full text-lg font-semibold text-white text-center border-2 border-white/30 bg-transparent transition-all duration-300 hover:bg-white/10 hover:border-white"
                >
                  Host an Event
                </Link>
              </div>

              <div className="flex gap-10 justify-center lg:justify-start">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#ff6b35' }}>150+</div>
                  <div className="text-sm opacity-80 mt-1">Active Players</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#ff6b35' }}>25+</div>
                  <div className="text-sm opacity-80 mt-1">Events Monthly</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#ff6b35' }}>12</div>
                  <div className="text-sm opacity-80 mt-1">SF Locations</div>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="flex justify-center items-center">
              <div className="relative">
                <div 
                  className="w-96 h-96 rounded-full flex items-center justify-center relative border-4"
                  style={{
                    background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {/* Tennis Racket */}
                  <div 
                    className="w-30 h-50 rounded-t-full rounded-b-md relative transform -rotate-12"
                    style={{ backgroundColor: '#8B4513' }}
                  >
                    <div 
                      className="absolute top-3 left-3 right-3 border-4 border-gray-800 rounded-full"
                      style={{ 
                        bottom: '60px',
                        background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)'
                      }}
                    />
                  </div>
                  
                  {/* Floating Tennis Balls */}
                  <div className="absolute w-8 h-8 bg-yellow-400 rounded-full animate-bounce" style={{ top: '20%', right: '10%', animationDelay: '0s' }} />
                  <div className="absolute w-8 h-8 bg-yellow-400 rounded-full animate-bounce" style={{ bottom: '30%', left: '15%', animationDelay: '1s' }} />
                  <div className="absolute w-8 h-8 bg-yellow-400 rounded-full animate-bounce" style={{ top: '60%', right: '25%', animationDelay: '2s' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="container max-w-6xl mx-auto px-5">
          <h2 className="text-4xl font-bold text-center mb-15 text-slate-800">
            Everything You Need to Compete
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="bg-white p-10 rounded-3xl text-center shadow-lg hover:-translate-y-2 transition-transform duration-300">
              <div 
                className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl text-white"
                style={{ background: 'linear-gradient(45deg, #ff6b35, #f7931e)' }}
              >
                🏆
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Competitive Tournaments</h3>
              <p className="text-slate-600 leading-relaxed">
                Join skill-matched tournaments every weekend. From casual doubles to serious singles competition.
              </p>
            </div>

            <div className="bg-white p-10 rounded-3xl text-center shadow-lg hover:-translate-y-2 transition-transform duration-300">
              <div 
                className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl text-white"
                style={{ background: 'linear-gradient(45deg, #ff6b35, #f7931e)' }}
              >
                🎾
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Smart Matching</h3>
              <p className="text-slate-600 leading-relaxed">
                Play against opponents at your level. Our system ensures competitive, fair matches every time.
              </p>
            </div>

            <div className="bg-white p-10 rounded-3xl text-center shadow-lg hover:-translate-y-2 transition-transform duration-300">
              <div 
                className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl text-white"
                style={{ background: 'linear-gradient(45deg, #ff6b35, #f7931e)' }}
              >
                👥
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Tennis Community</h3>
              <p className="text-slate-600 leading-relaxed">
                Connect with local players, form regular hitting groups, and build lasting tennis friendships.
              </p>
            </div>

            <div className="bg-white p-10 rounded-3xl text-center shadow-lg hover:-translate-y-2 transition-transform duration-300">
              <div 
                className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl text-white"
                style={{ background: 'linear-gradient(45deg, #ff6b35, #f7931e)' }}
              >
                📱
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Easy Organization</h3>
              <p className="text-slate-600 leading-relaxed">
                Host your own tournaments with automated brackets, scoring, and player communication.
              </p>
            </div>

            <div className="bg-white p-10 rounded-3xl text-center shadow-lg hover:-translate-y-2 transition-transform duration-300">
              <div 
                className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl text-white"
                style={{ background: 'linear-gradient(45deg, #ff6b35, #f7931e)' }}
              >
                📊
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Track Your Progress</h3>
              <p className="text-slate-600 leading-relaxed">
                See your match history, ranking improvements, and tournament achievements over time.
              </p>
            </div>

            <div className="bg-white p-10 rounded-3xl text-center shadow-lg hover:-translate-y-2 transition-transform duration-300">
              <div 
                className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl text-white"
                style={{ background: 'linear-gradient(45deg, #ff6b35, #f7931e)' }}
              >
                🏅
              </div>
              <h3 className="text-xl font-semibold mb-4 text-slate-800">Leagues & Ladders</h3>
              <p className="text-slate-600 leading-relaxed">
                Join ongoing leagues for consistent competitive play throughout the season.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-20 text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1a365d, #4a90b8)' }}
      >
        <div className="container max-w-6xl mx-auto px-5">
          <h2 className="text-4xl lg:text-5xl font-bold mb-5">
            Ready to Elevate Your Game?
          </h2>
          <p className="text-xl mb-10 opacity-90">
            Join San Francisco&apos;s most active tennis community. Your next great match is waiting.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto bg-white/10 p-2 rounded-full">
            <input 
              type="email" 
              placeholder="Enter your email to get started"
              className="flex-1 px-6 py-4 rounded-full border-none text-gray-900 bg-white/90 placeholder:text-gray-600"
            />
            <Link 
              href="/auth/signup"
              className="px-8 py-4 rounded-full text-white font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
              style={{
                background: 'linear-gradient(45deg, #ff6b35, #f7931e)',
                boxShadow: '0 8px 25px rgba(255, 107, 53, 0.3)'
              }}
            >
              Get Early Access
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
