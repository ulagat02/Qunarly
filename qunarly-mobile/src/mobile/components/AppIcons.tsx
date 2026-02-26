import React from 'react';
import Svg, { Path } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

export const PriceTagIcon: React.FC<IconProps> = ({ size = 24, color = '#111827' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"
      fill={color}
    />
  </Svg>
);

export const CropsIcon: React.FC<IconProps> = ({ size = 24, color = '#111827' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2c-1.1 0-2 .9-2 2v.5c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1zm5.5 1c-.55 0-1 .45-1 1v1.5c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1zm-11 0c-.55 0-1 .45-1 1v1.5c0 .55.45 1 1 1s1-.45 1-1V4c0-.55-.45-1-1-1zM12 8c-1.1 0-2 .9-2 2v12h4V10c0-1.1-.9-2-2-2zm5.5 0c-1.1 0-2 .9-2 2v12h4V10c0-1.1-.9-2-2-2zm-11 0c-1.1 0-2 .9-2 2v12h4V10c0-1.1-.9-2-2-2z"
      fill={color}
    />
  </Svg>
);

export const PackageIcon: React.FC<IconProps> = ({ size = 24, color = '#111827' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z"
      fill={color}
    />
  </Svg>
);

export const DeliveryProgressIcon: React.FC<IconProps> = ({ size = 24, color = '#111827' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm13.5-8.5l1.96 2.5H17V9.5h2.5zM18 18c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"
      fill={color}
    />
  </Svg>
);

export const WarehouseIcon: React.FC<IconProps> = ({ size = 24, color = '#111827' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 21V7L12 3 2 7v14h5v-9h10v9h5zm-11-2H9v2h2v-2zm2-3h-2v2h2v-2zm2 3h-2v2h2v-2z"
      fill={color}
    />
  </Svg>
);
