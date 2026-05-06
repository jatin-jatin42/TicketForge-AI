import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navigation from './Navigation';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/utils/auth-utils';
import { decodeAccessToken } from '@/utils/jwt-utils';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    usePathname: jest.fn(),
    useRouter: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
    return ({ children, href, onClick }: any) => {
        return <a href={href} onClick={onClick}>{children}</a>;
    };
});

// Mock auth utils
jest.mock('@/utils/auth-utils', () => ({
    isAuthenticated: jest.fn(),
    logout: jest.fn(),
}));

// Mock jwt utils
jest.mock('@/utils/jwt-utils', () => ({
    decodeAccessToken: jest.fn(),
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
    Search: () => <div data-testid="search-icon" />,
    Ticket: () => <div data-testid="ticket-icon" />,
    Menu: () => <div data-testid="menu-icon" />,
    User: () => <div data-testid="user-icon" />,
    LogOut: () => <div data-testid="logout-icon" />,
    Settings: () => <div data-testid="settings-icon" />,
}));

describe('Navigation Component', () => {
    const mockPush = jest.fn();
    const mockOnMobileMenuToggle = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        (usePathname as jest.Mock).mockReturnValue('/');
        (isAuthenticated as jest.Mock).mockReturnValue(false);
    });

    it('renders sign in button when not authenticated', () => {
        render(<Navigation isSidebarCollapsed={false} onMobileMenuToggle={mockOnMobileMenuToggle} />);
        expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('renders account menu when authenticated', () => {
        (isAuthenticated as jest.Mock).mockReturnValue(true);
        (decodeAccessToken as jest.Mock).mockReturnValue({ role: 'USER' });
        // Simulate token in localStorage for the useEffect
        Object.defineProperty(window, 'localStorage', {
            value: { getItem: jest.fn().mockReturnValue('mock-token') },
            writable: true
        });

        render(<Navigation isSidebarCollapsed={false} onMobileMenuToggle={mockOnMobileMenuToggle} />);

        expect(screen.getByText('Account')).toBeInTheDocument();
        expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });

    it('opens mobile menu on hamburger click', () => {
        render(<Navigation isSidebarCollapsed={false} onMobileMenuToggle={mockOnMobileMenuToggle} />);
        const menuButton = screen.queryByTestId('menu-icon')?.closest('button');
        if (menuButton) {
            fireEvent.click(menuButton);
        }
        expect(mockOnMobileMenuToggle).toHaveBeenCalled();
    });

    it('performs search on form submit', () => {
        render(<Navigation isSidebarCollapsed={false} onMobileMenuToggle={mockOnMobileMenuToggle} />);
        const input = screen.getByPlaceholderText(/search events/i);
        fireEvent.change(input, { target: { value: 'concert' } });

        const searchButton = screen.getByRole('button', { name: /search/i });
        fireEvent.click(searchButton);

        expect(mockPush).toHaveBeenCalledWith('/events?search=concert');
    });

    it('handles logout flow', () => {
        (isAuthenticated as jest.Mock).mockReturnValue(true);
        Object.defineProperty(window, 'localStorage', {
            value: { getItem: jest.fn().mockReturnValue('mock-token') },
            writable: true
        });
        (decodeAccessToken as jest.Mock).mockReturnValue({ role: 'USER' });

        render(<Navigation isSidebarCollapsed={false} onMobileMenuToggle={mockOnMobileMenuToggle} />);

        // Open menu
        fireEvent.click(screen.getByText('Account'));

        // Click logout
        fireEvent.click(screen.getByText(/logout/i));

        expect(logout).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/');
    });
});
