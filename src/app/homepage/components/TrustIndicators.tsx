import React from 'react';
import Icon from '@/components/ui/AppIcon';
import TiltCard from '@/components/ui/TiltCard';

const TrustIndicators = () => {
  const indicators = [
    {
      icon: 'ShieldCheckIcon',
      title: 'Verified Properties',
      description:
        'Every property is meticulously verified by our team to ensure quality and safety.',
    },
    {
      icon: 'UserGroupIcon',
      title: '50,000+ Happy Guests',
      description:
        'Join a community of thousands of satisfied travelers who trust us with their stay.',
    },
    {
      icon: 'ClockIcon',
      title: '24/7 Support',
      description:
        'Our dedicated customer support team is available round-the-clock to assist you.',
    },
    {
      icon: 'CurrencyRupeeIcon',
      title: 'Best Price Guarantee',
      description:
        'We offer competitive rates with no hidden fees, ensuring you get the best value.',
    },
  ];

  return (
    <section className="py-8 md:py-20 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 md:mb-16">
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-100 tracking-tight">
            Why Choose Us?
          </h2>
          <p className="font-sans mt-2 md:mt-4 text-sm sm:text-base md:text-xl text-zinc-400 max-w-3xl mx-auto px-2">
            Experience peace of mind and unparalleled service with StayCool Booking.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {indicators.map((indicator, index) => (
            <div
              key={index}
              className="h-full"
            >
              <TiltCard className="h-full" tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.05} glareMaxOpacity={0.1}>
                <div className="bg-zinc-900/40 border border-zinc-800 p-4 md:p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 h-full text-center group">
                  <div className="flex items-center justify-center h-10 w-10 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full bg-sky-500/10 mx-auto mb-3 md:mb-6 group-hover:bg-sky-500/20 transition-colors">
                    <Icon name={indicator.icon} size={24} className="text-sky-400 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                  </div>
                  <h3 className="font-heading text-base sm:text-lg md:text-xl font-bold text-zinc-100">
                    {indicator.title}
                  </h3>
                  <p className="font-sans mt-1 md:mt-2 text-zinc-500 text-xs sm:text-sm">{indicator.description}</p>
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustIndicators;
