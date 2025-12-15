"use client";

export default function FarmingBackground() {
  return (
    <>
      {/* Decorative Farming Elements - Large Background Pattern with Animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-5deg); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none opacity-[0.08] z-0">
        {/* Top Left Area */}
        <div className="absolute top-[5%] left-[3%] text-[120px] animate-bounce" style={{animationDuration: '4s'}}>🌾</div>
        <div className="absolute top-[8%] left-[18%] text-[110px]" style={{animation: 'float-slow 6s ease-in-out infinite'}}>🌱</div>
        
        {/* Top Right Area */}
        <div className="absolute top-[12%] right-[5%] text-[140px]" style={{animation: 'float 5s ease-in-out infinite'}}>🚜</div>
        <div className="absolute top-[6%] right-[22%] text-[100px]" style={{animation: 'float-slower 5.5s ease-in-out infinite'}}>🌾</div>
        <div className="absolute top-[15%] right-[38%] text-[120px]" style={{animation: 'float-slow 6.2s ease-in-out infinite'}}>🍅</div>
        
        {/* Middle Left Area */}
        <div className="absolute top-[35%] left-[8%] text-[115px]" style={{animation: 'float-slow 5s ease-in-out infinite'}}>🍃</div>
        <div className="absolute top-[45%] left-[25%] text-[135px]" style={{animation: 'float-slower 4.8s ease-in-out infinite'}}>🌿</div>
        
        {/* Middle Right Area */}
        <div className="absolute top-[38%] right-[12%] text-[130px]" style={{animation: 'float 4.5s ease-in-out infinite'}}>🌻</div>
        <div className="absolute top-[52%] right-[28%] text-[125px]" style={{animation: 'float 4.2s ease-in-out infinite'}}>🌾</div>
        
        {/* Center Area */}
        <div className="absolute top-[48%] left-[45%] text-[105px]" style={{animation: 'float 5.2s ease-in-out infinite'}}>🥕</div>
        
        {/* Bottom Left Area */}
        <div className="absolute bottom-[18%] left-[6%] text-[125px]" style={{animation: 'float 6.5s ease-in-out infinite'}}>🌽</div>
        <div className="absolute bottom-[8%] left-[28%] text-[110px]" style={{animation: 'float-slower 5.8s ease-in-out infinite'}}>🫛</div>
        
        {/* Bottom Right Area */}
        <div className="absolute bottom-[25%] right-[15%] text-[115px]" style={{animation: 'float-slow 5s ease-in-out infinite'}}>🍃</div>
        <div className="absolute bottom-[12%] right-[35%] text-[120px]" style={{animation: 'float 5.5s ease-in-out infinite'}}>🥬</div>
        
        {/* Additional scattered elements */}
        <div className="absolute top-[25%] left-[42%] text-[100px]" style={{animation: 'float-slower 6.8s ease-in-out infinite'}}>🫑</div>
        <div className="absolute top-[62%] left-[65%] text-[115px]" style={{animation: 'float 4.6s ease-in-out infinite'}}>🥔</div>
        <div className="absolute bottom-[35%] left-[15%] text-[108px]" style={{animation: 'float-slow 5.3s ease-in-out infinite'}}>🧅</div>
        <div className="absolute top-[72%] right-[8%] text-[118px]" style={{animation: 'float-slower 6.1s ease-in-out infinite'}}>🍆</div>
      </div>
    </>
  );
}
