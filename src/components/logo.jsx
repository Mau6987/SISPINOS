const LogoWithText = ({ logoSize = 'h-16 w-16', textSize = 'text-xl' }) => (
  <div className="flex flex-col items-center">
    <div className={`${logoSize} mb-2`}>
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Olas de agua */}
        <path d="M30 120C50 100 70 110 100 110C130 110 150 100 170 120C150 140 130 130 100 130C70 130 50 140 30 120Z" fill="#3B82F6"/>
        <path d="M40 125C55 110 70 115 100 115C130 115 145 110 160 125C145 135 130 132 100 132C70 132 55 135 40 125Z" fill="#1D4ED8"/>
        
        {/* Pinos */}
        <path d="M100 30L80 70H120L100 30Z" fill="#166534"/>
        <path d="M100 50L85 80H115L100 50Z" fill="#166534"/>
        <path d="M100 70L90 90H110L100 70Z" fill="#166534"/>
      </svg>
    </div>
    <div className="text-center">
      <div className={`font-bold text-blue-900 ${textSize}`}>DISTRIBUIDORA DE AGUA</div>
      <div className={`font-bold text-blue-900 ${textSize === 'text-xl' ? 'text-2xl' : `text-${parseInt(textSize.split('-')[1]) + 4}`}`}>LOS PINOS</div>
    </div>
  </div>
);

export default LogoWithText;
