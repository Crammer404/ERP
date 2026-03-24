'use client';

import { CreditCard, ReceiptText, User, Wallet } from 'lucide-react';

type ActiveSection = 'profile' | 'subscription' | 'payment' | 'billing';

interface AccountSettingsSidebarProps {
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
  sectionItems: Array<{ key: ActiveSection; label: string }>;
}

export function AccountSettingsSidebar({
  activeSection,
  setActiveSection,
  sectionItems,
}: AccountSettingsSidebarProps) {
  const sectionIcons = {
    profile: User,
    subscription: CreditCard,
    payment: Wallet,
    billing: ReceiptText,
  } as const;

  return (
    <div className="py-4 pr-4">
      <div className="grid grid-cols-4 lg:grid-cols-1 gap-2">
        {sectionItems.map((item) => (
          (() => {
            const Icon = sectionIcons[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveSection(item.key)}
                className={`w-full px-2 py-2 rounded-md text-sm transition-colors flex items-center justify-center lg:justify-start gap-2 ${
                  activeSection === item.key
                    ? 'text-foreground font-semibold bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
                aria-label={item.label}
                title={item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            );
          })()
        ))}
      </div>
    </div>
  );
}
