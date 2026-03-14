/**
 * Star Wars Comedic Relief Error Page
 * "These aren't the droids you're looking for..."
 */

import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const QUOTES = [
  { text: "I've got a bad feeling about this...", who: 'Han Solo' },
  { text: "These aren't the droids you're looking for.", who: 'Obi-Wan Kenobi' },
  { text: 'Do. Or do not. There is no try.', who: 'Yoda' },
  { text: "It's a trap!", who: 'Admiral Ackbar' },
  { text: 'I find your lack of routes disturbing.', who: 'Darth Vader' },
  { text: 'Never tell me the odds!', who: 'Han Solo' },
  { text: 'The garbage will do!', who: 'Rey' },
  { text: "This is not the page you're looking for.", who: 'Obi-Wan Kenobi' },
  { text: 'Great, kid. Don\'t get cocky.', who: 'Han Solo' },
  { text: 'Your overconfidence is your weakness.', who: 'Luke Skywalker' },
];

const DROID_ASCII = `
     ___
    /   \\
   |  o  |
   | --- |
   |_____|
    /| |\\
   / | | \\
  *  | |  *
     | |
    _| |_
   |_____|
`;

const DEATH_STAR_ASCII = `
       .          .
     .  *  . *.  .  *
   .   _____     .    .
  .  /  404  \\  .  *
 .  |  ~~~~~  |   .
 *  |  ERROR  |  .   .
  . |  ~~~~~  |    *
   . \\_______/  .
  .   *  .  .    .  .
     .       * .
`;

export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [stars, setStars] = useState<{ x: number; y: number; size: number; delay: number }[]>([]);

  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const statusCode = isRouteErrorResponse(error) ? error.status : 500;
  const statusText = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : 'Unknown disturbance in the Force';

  useEffect(() => {
    const s = Array.from({ length: 60 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 3,
    }));
    setStars(s);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Starfield */}
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            opacity: 0.3 + Math.random() * 0.5,
            animationDelay: `${star.delay}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}

      {/* Holographic scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(37,214,149,0.1) 2px, rgba(37,214,149,0.1) 4px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg mx-auto">
        {/* ASCII Art */}
        <pre className="text-[#25D695]/60 text-[10px] sm:text-xs font-mono leading-tight mb-6 select-none">
          {is404 ? DEATH_STAR_ASCII : DROID_ASCII}
        </pre>

        {/* Error Code — Star Wars crawl style */}
        <div className="mb-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#25D695]/40">
            Error Code
          </span>
          <h1 className="text-6xl sm:text-8xl font-black text-white font-mono mt-1 tracking-tight">
            {statusCode}
          </h1>
        </div>

        {/* Status */}
        <p className="text-sm text-gray-400 font-mono mb-6">
          {statusText}
        </p>

        {/* Quote */}
        <div className="bg-[#111820] border border-[#1C2432] rounded-lg p-5 mb-8">
          <p className="text-base sm:text-lg text-[#25D695] italic font-medium leading-relaxed">
            "{quote.text}"
          </p>
          <p className="text-[11px] text-gray-500 font-mono mt-2">
            — {quote.who}
          </p>
        </div>

        {/* Flavor text */}
        <p className="text-xs text-gray-600 font-mono mb-8 max-w-sm mx-auto leading-relaxed">
          {is404
            ? 'The page you seek has been destroyed, much like Alderaan. Perhaps the navigation computer can help.'
            : 'A disturbance in the Force has caused an unexpected error. The Jedi Council has been notified.'}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-[#1C2432] text-gray-300 hover:bg-[#1C2432]/80 hover:text-white transition-colors border border-[#1C2432]"
          >
            <span className="text-base leading-none">&larr;</span>
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-[#25D695] text-gray-950 hover:bg-[#25D695]/90 transition-colors"
          >
            Return to Base
          </button>
        </div>

        {/* Footer quip */}
        <p className="text-[10px] text-gray-700 font-mono mt-10">
          Transmission from NexusOS Command &bull; Sector 7G &bull; Stardate {new Date().getFullYear()}.{String(new Date().getMonth() + 1).padStart(2, '0')}
        </p>
      </div>
    </div>
  );
}
