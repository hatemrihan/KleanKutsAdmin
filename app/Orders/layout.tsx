'use client';

import Nav from '../sections/nav';

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen dark:bg-black">
      <Nav />
      <div className="flex-1 lg:pl-0">
        {children}
      </div>
    </div>
  );
}
