'use client'

import { NextUIProvider } from '@nextui-org/react';
import React from 'react';

type LayoutProps = {
    children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
    return (
        <NextUIProvider>
            {children}
        </NextUIProvider>
    );
};

export default Layout;
