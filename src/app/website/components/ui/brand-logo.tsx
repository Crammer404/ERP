import { BRANDING_CONFIG } from '../../config/brand.config';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = '', size = 32 }: LogoProps) {
  const { logo, colors } = BRANDING_CONFIG;

  return (
    <svg
      width={size}
      height={size}
      viewBox={logo.default.viewBox}
      className={className}
      style={{ color: colors.primaryHex }}
    >
      {logo.default.paths.map((path, index) => (
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
}
