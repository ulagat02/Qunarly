import {
  HomeIcon,
  SearchIcon,
  NotificationIcon,
  ProfileIcon,
  SettingsIcon,
  TaxiIcon,
  QueueIcon,
  RouteIcon,
  CarOnWayIcon,
  CarArrivedIcon,
  PackageIcon,
  RelayIcon,
  OrderAcceptedIcon,
  DeliveryProgressIcon,
  DeliveredIcon,
  VillageIcon,
  FarmerIcon,
  CropsIcon,
  LivestockIcon,
  WarehouseIcon,
  SellIcon,
  BuyIcon,
  PriceTagIcon,
  PaymentCardIcon,
  IncomeGrowthIcon,
  WaitingIcon,
  ConfirmedIcon,
  CancelledIcon,
  ErrorIcon,
  InfoIcon,
} from '@/app/components/icons';

interface IconShowcaseProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}

const IconShowcase: React.FC<IconShowcaseProps> = ({ icon: Icon, label }) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
      <div className="flex items-center justify-center w-16 h-16 mb-3 rounded-xl bg-gray-50">
        <Icon size={32} className="text-gray-900" />
      </div>
      <span className="text-sm text-center text-gray-600 font-medium">{label}</span>
    </div>
  );
};

export default function App() {
  const iconCategories = [
    {
      category: 'Core Navigation',
      icons: [
        { icon: HomeIcon, label: 'Home' },
        { icon: SearchIcon, label: 'Search' },
        { icon: NotificationIcon, label: 'Notifications' },
        { icon: ProfileIcon, label: 'User Profile' },
        { icon: SettingsIcon, label: 'Settings' },
      ],
    },
    {
      category: 'Taxi & Movement',
      icons: [
        { icon: TaxiIcon, label: 'Taxi Car' },
        { icon: QueueIcon, label: 'People Queue' },
        { icon: RouteIcon, label: 'Route A to B' },
        { icon: CarOnWayIcon, label: 'Car On Way' },
        { icon: CarArrivedIcon, label: 'Car Arrived' },
      ],
    },
    {
      category: 'Logistics & Delivery',
      icons: [
        { icon: PackageIcon, label: 'Package Box' },
        { icon: RelayIcon, label: 'Relay Logistics' },
        { icon: OrderAcceptedIcon, label: 'Order Accepted' },
        { icon: DeliveryProgressIcon, label: 'Delivery Progress' },
        { icon: DeliveredIcon, label: 'Delivered' },
      ],
    },
    {
      category: 'Village & Agriculture',
      icons: [
        { icon: VillageIcon, label: 'Village' },
        { icon: FarmerIcon, label: 'Farmer' },
        { icon: CropsIcon, label: 'Crops' },
        { icon: LivestockIcon, label: 'Livestock' },
        { icon: WarehouseIcon, label: 'Warehouse' },
      ],
    },
    {
      category: 'Commerce & Status',
      icons: [
        { icon: SellIcon, label: 'Sell' },
        { icon: BuyIcon, label: 'Buy' },
        { icon: PriceTagIcon, label: 'Price Tag' },
        { icon: PaymentCardIcon, label: 'Payment Card' },
        { icon: IncomeGrowthIcon, label: 'Income Growth' },
      ],
    },
    {
      category: 'System States',
      icons: [
        { icon: WaitingIcon, label: 'Waiting' },
        { icon: ConfirmedIcon, label: 'Confirmed' },
        { icon: CancelledIcon, label: 'Cancelled' },
        { icon: ErrorIcon, label: 'Error' },
        { icon: InfoIcon, label: 'Information' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-3">Unified Icon Set</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A comprehensive collection of 30 filled, rounded icons designed for mobile app UI.
            All icons feature consistent proportions, simple geometry, and clear silhouettes,
            optimized for readability at 24px, 32px, and 48px sizes.
          </p>
        </div>

        {/* Size Preview */}
        <div className="mb-12 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="mb-6 text-center">Size Preview</h2>
          <div className="flex items-center justify-center gap-12">
            <div className="flex flex-col items-center gap-3">
              <HomeIcon size={24} className="text-gray-900" />
              <span className="text-sm text-gray-600">24px</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <HomeIcon size={32} className="text-gray-900" />
              <span className="text-sm text-gray-600">32px</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <HomeIcon size={48} className="text-gray-900" />
              <span className="text-sm text-gray-600">48px</span>
            </div>
          </div>
        </div>

        {/* Icon Categories */}
        <div className="space-y-12">
          {iconCategories.map((category) => (
            <div key={category.category}>
              <h2 className="mb-6 text-gray-800">{category.category}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {category.icons.map((iconData) => (
                  <IconShowcase
                    key={iconData.label}
                    icon={iconData.icon}
                    label={iconData.label}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-sm text-gray-500">
          <p>
            All icons follow a unified design system with filled shapes, rounded corners, and
            consistent visual weight.
          </p>
        </div>
      </div>
    </div>
  );
}
