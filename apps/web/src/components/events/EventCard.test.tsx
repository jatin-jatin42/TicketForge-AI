import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventCard } from './EventCard';

// Mock formatPrice since it might use locale settings
jest.mock('@/lib/utils', () => ({
    cn: (...args: any[]) => args.filter(Boolean).join(' '),
    formatPrice: (price: number) => `₹${(price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    Calendar: () => <div data-testid="calendar-icon" />,
    MapPin: () => <div data-testid="mappin-icon" />,
}));

// Mock next/link
jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode, href: string }) => {
        return <a href={href}>{children}</a>;
    };
});

describe('EventCard Component', () => {
    const mockVenue = {
        name: 'Test Venue',
        location: 'Test City',
    };

    const defaultProps = {
        id: 'env-1',
        name: 'Test Event',
        date: '2026-12-31T10:00:00Z',
        venue: mockVenue,
        minPrice: 150000, // 1500 INR in paise
    };

    it('renders event name and venue details', () => {
        render(<EventCard {...defaultProps} />);

        expect(screen.getByText('Test Event')).toBeInTheDocument();
        expect(screen.getByText('Test Venue, Test City')).toBeInTheDocument();
    });

    it('renders formatted price from paise', () => {
        render(<EventCard {...defaultProps} />);

        // 150000 paise = 1500 INR
        expect(screen.getByText(/₹1,500\.00/)).toBeInTheDocument();
    });

    it('renders "Tickets Available" when minPrice is missing', () => {
        const props = { ...defaultProps, minPrice: undefined };
        render(<EventCard {...props} />);

        expect(screen.getByText('Tickets Available')).toBeInTheDocument();
    });

    it('renders correctly even with a numeric date (timestamp)', () => {
        const timestamp = new Date('2026-12-31T10:00:00Z').getTime();
        render(<EventCard {...defaultProps} date={timestamp} />);

        // date-fns format('EEE, MMM d • h:mm a') for 2026-12-31 10:00 UTC
        // Depending on timezone of test environment, this might vary, but let's check for basic parts
        expect(screen.getByText(/Dec 31/)).toBeInTheDocument();
    });

    it('shows "Date TBA" for invalid dates', () => {
        render(<EventCard {...defaultProps} date="invalid" />);
        expect(screen.getByText('Date TBA')).toBeInTheDocument();
    });

    it('contains a link to the event page', () => {
        render(<EventCard {...defaultProps} />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/events/env-1');
    });
});
