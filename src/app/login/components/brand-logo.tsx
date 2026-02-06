'use client';

import { getBrandLogo } from '@/config/brand.config';

export const BrandLogo = () => {
  const logo = getBrandLogo();

  return (
    <svg
      viewBox={logo.viewBox}
      className="h-12 w-12 text-primary"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {logo.paths.map((path, index) => (
        <path
          key={index}
          d={path.d}
          fill={path.fill}
          stroke={path.stroke}
          strokeLinecap={path.strokeLinecap}
          strokeLinejoin={path.strokeLinejoin}
          strokeWidth={path.strokeWidth}
        />
      ))}
    </svg>
  );
};