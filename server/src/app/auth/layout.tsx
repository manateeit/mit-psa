import { Theme } from '@radix-ui/themes';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <Theme>
      {children}
    </Theme>
  );
}
