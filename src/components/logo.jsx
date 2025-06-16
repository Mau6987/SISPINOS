const LogoWithText = ({
  logoSize = "h-24 w-24",
  textSize = "text-lg",
  variant = "vertical", // 'vertical' | 'horizontal'
  showText = true, // Nuevo prop para controlar la visibilidad del texto
}) => {
  const getTextSizeClass = (baseSize) => {
    const sizeMap = {
      "text-sm": "text-xs",
      "text-base": "text-sm",
      "text-lg": "text-base",
      "text-xl": "text-lg",
      "text-2xl": "text-xl",
    };
    return sizeMap[baseSize] || "text-sm";
  };

  const smallerTextSize = getTextSizeClass(textSize);

  const renderHorizontal = () => (
    <div className="flex items-center gap-2">
      <div className={`${logoSize} flex-shrink-0`}>
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-lg"
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
            <linearGradient id="pineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
            <radialGradient id="backgroundGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F0F9FF" />
              <stop offset="100%" stopColor="#E0F2FE" />
            </radialGradient>
          </defs>

          {/* Circular Background */}
          <circle cx="100" cy="100" r="95" fill="url(#backgroundGradient)" stroke="#0EA5E9" strokeWidth="2" />

          {/* Improved Water Waves */}
          <path
            d="M25 130C45 105 70 115 100 115C130 115 155 105 175 130C155 150 130 140 100 140C70 140 45 150 25 130Z"
            fill="url(#waterGradient)"
            opacity="0.9"
          />
          <path
            d="M35 135C50 115 70 120 100 120C130 120 150 115 165 135C150 145 130 142 100 142C70 142 50 145 35 135Z"
            fill="#1D4ED8"
            opacity="0.8"
          />
          <path
            d="M45 140C60 125 75 128 100 128C125 128 140 125 155 140C140 148 125 146 100 146C75 146 60 148 45 140Z"
            fill="#2563EB"
            opacity="0.6"
          />

          {/* Improved Pines with More Detail */}
          <g transform="translate(100, 100)">
            {/* Main Pine */}
            <path d="M0 -70L-25 -25H25L0 -70Z" fill="url(#pineGradient)" />
            <path d="M0 -50L-20 -15H20L0 -50Z" fill="url(#pineGradient)" />
            <path d="M0 -30L-15 -5H15L0 -30Z" fill="url(#pineGradient)" />

            {/* Trunk */}
            <rect x="-3" y="-5" width="6" height="15" fill="#92400E" rx="1" />

            {/* Secondary Pines */}
            <g transform="translate(-35, 10) scale(0.6)">
              <path d="M0 -40L-15 -10H15L0 -40Z" fill="#16A34A" />
              <path d="M0 -25L-12 -5H12L0 -25Z" fill="#16A34A" />
              <rect x="-2" y="-5" width="4" height="10" fill="#92400E" rx="1" />
            </g>

            {/* Secondary Pines */}
            <g transform="translate(35, 15) scale(0.5)">
              <path d="M0 -35L-12 -8H12L0 -35Z" fill="#16A34A" />
              <path d="M0 -20L-10 -3H10L0 -20Z" fill="#16A34A" />
              <rect x="-2" y="-3" width="4" height="8" fill="#92400E" rx="1" />
            </g>
          </g>

          {/* Additional Details */}
          <circle cx="60" cy="125" r="2" fill="#BFDBFE" opacity="0.7" />
          <circle cx="140" cy="135" r="1.5" fill="#BFDBFE" opacity="0.7" />
          <circle cx="80" cy="145" r="1" fill="#BFDBFE" opacity="0.7" />
        </svg>
      </div>
      {showText && (
        <div className="text-left">
          <div className={`font-bold text-blue-900 leading-tight ${smallerTextSize}`}>DISTRIBUIDORA DE AGUA</div>
          <div className={`font-black text-blue-800 leading-tight ${textSize}`}>LOS PINOS</div>
        </div>
      )}
    </div>
  );

  const renderVertical = () => (
    <div className="flex flex-col items-center space-y-1">
      <div className={`${logoSize} flex-shrink-0`}>
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-lg"
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
            <linearGradient id="pineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22C55E" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
            <radialGradient id="backgroundGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F0F9FF" />
              <stop offset="100%" stopColor="#E0F2FE" />
            </radialGradient>
          </defs>

          {/* Circular Background */}
          <circle cx="100" cy="100" r="95" fill="url(#backgroundGradient)" stroke="#0EA5E9" strokeWidth="2" />

          {/* Improved Water Waves */}
          <path
            d="M25 130C45 105 70 115 100 115C130 115 155 105 175 130C155 150 130 140 100 140C70 140 45 150 25 130Z"
            fill="url(#waterGradient)"
            opacity="0.9"
          />
          <path
            d="M35 135C50 115 70 120 100 120C130 120 150 115 165 135C150 145 130 142 100 142C70 142 50 145 35 135Z"
            fill="#1D4ED8"
            opacity="0.8"
          />
          <path
            d="M45 140C60 125 75 128 100 128C125 128 140 125 155 140C140 148 125 146 100 146C75 146 60 148 45 140Z"
            fill="#2563EB"
            opacity="0.6"
          />

          {/* Improved Pines with More Detail */}
          <g transform="translate(100, 100)">
            {/* Main Pine */}
            <path d="M0 -70L-25 -25H25L0 -70Z" fill="url(#pineGradient)" />
            <path d="M0 -50L-20 -15H20L0 -50Z" fill="url(#pineGradient)" />
            <path d="M0 -30L-15 -5H15L0 -30Z" fill="url(#pineGradient)" />

            {/* Trunk */}
            <rect x="-3" y="-5" width="6" height="15" fill="#92400E" rx="1" />

            {/* Secondary Pines */}
            <g transform="translate(-35, 10) scale(0.6)">
              <path d="M0 -40L-15 -10H15L0 -40Z" fill="#16A34A" />
              <path d="M0 -25L-12 -5H12L0 -25Z" fill="#16A34A" />
              <rect x="-2" y="-5" width="4" height="10" fill="#92400E" rx="1" />
            </g>

            <g transform="translate(35, 15) scale(0.5)">
              <path d="M0 -35L-12 -8H12L0 -35Z" fill="#16A34A" />
              <path d="M0 -20L-10 -3H10L0 -20Z" fill="#16A34A" />
              <rect x="-2" y="-3" width="4" height="8" fill="#92400E" rx="1" />
            </g>
          </g>

          {/* Additional Details */}
          <circle cx="60" cy="125" r="2" fill="#BFDBFE" opacity="0.7" />
          <circle cx="140" cy="135" r="1.5" fill="#BFDBFE" opacity="0.7" />
          <circle cx="80" cy="145" r="1" fill="#BFDBFE" opacity="0.7" />
        </svg>
      </div>

      {showText && (
        <div className="text-center space-y-1">
          <div className={`font-bold text-blue-900 leading-tight ${smallerTextSize}`}>DISTRIBUIDORA DE AGUA</div>
          <div className={`font-black text-blue-800 leading-tight ${textSize}`}>LOS PINOS</div>
        </div>
      )}
    </div>
  );

  return variant === "horizontal" ? renderHorizontal() : renderVertical();
};

export default LogoWithText;
