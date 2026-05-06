/**
 * Example: Testing a React Component
 * 
 * This shows how to test UI components with user interactions
 * 
 * NOTE: This is an EXAMPLE file (.example.tsx) for learning purposes.
 * When you create your actual test files (*.test.tsx), the jest.setup.js
 * will automatically import @testing-library/jest-dom for you.
 * We import it here explicitly for this example to work standalone.
 */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Jest globals (describe, test, expect, jest) are automatically available
// No need to import them when using ts-jest

// Mock component for demonstration
// In real scenario, import your actual component:
// import { EventCard } from './EventCard';

// Mock EventCard component for this example
const EventCard = ({ event, onBook }: any) => (
    <article data-testid="event-card">
        <h2>{event.name}</h2>
        <p>{event.venue}</p>
        <p>₹{event.price.toLocaleString()}</p>
        <p>{event.availableSeats} seats available</p>
        {event.availableSeats === 0 && <span>Sold Out</span>}
        <button onClick={() => onBook(event.id)}>Book Now</button>
    </article>
);

describe('EventCard Component', () => {
    const mockEvent = {
        id: 'event-123',
        name: 'Rock Concert 2026',
        venue: 'Madison Square Garden',
        date: new Date('2026-12-31T20:00:00Z'),
        price: 1500,
        availableSeats: 50,
        imageUrl: '/images/concert.jpg',
    };

    test('should render event information correctly', () => {
        // Arrange
        const mockOnBook = jest.fn();

        // Act
        render(<EventCard event={mockEvent} onBook={mockOnBook} />);

        // Assert
        expect(screen.getByText('Rock Concert 2026')).toBeInTheDocument();
        expect(screen.getByText('Madison Square Garden')).toBeInTheDocument();
        expect(screen.getByText('₹1,500')).toBeInTheDocument();
        expect(screen.getByText('50 seats available')).toBeInTheDocument();
    });

    test('should call onBook callback when "Book Now" is clicked', async () => {
        // Arrange
        const mockOnBook = jest.fn();
        const user = userEvent.setup();

        // Act
        render(<EventCard event={mockEvent} onBook={mockOnBook} />);
        const bookButton = screen.getByRole('button', { name: /book now/i });
        await user.click(bookButton);

        // Assert
        expect(mockOnBook).toHaveBeenCalledTimes(1);
        expect(mockOnBook).toHaveBeenCalledWith('event-123');
    });

    test('should display "Sold Out" badge when no seats available', () => {
        // Arrange
        const soldOutEvent = { ...mockEvent, availableSeats: 0 };
        const mockOnBook = jest.fn();

        // Act
        render(<EventCard event={soldOutEvent} onBook={mockOnBook} />);

        // Assert
        expect(screen.getByText('Sold Out')).toBeInTheDocument();
        expect(screen.getByText('0 seats available')).toBeInTheDocument();
    });

    test('should not display "Sold Out" when seats are available', () => {
        // Arrange
        const mockOnBook = jest.fn();

        // Act
        render(<EventCard event={mockEvent} onBook={mockOnBook} />);

        // Assert
        expect(screen.queryByText('Sold Out')).not.toBeInTheDocument();
    });

    test('should handle multiple rapid clicks gracefully', async () => {
        // Arrange
        const mockOnBook = jest.fn();
        const user = userEvent.setup();

        // Act
        render(<EventCard event={mockEvent} onBook={mockOnBook} />);
        const bookButton = screen.getByRole('button', { name: /book now/i });

        // Click multiple times rapidly
        await user.click(bookButton);
        await user.click(bookButton);
        await user.click(bookButton);

        // Assert
        expect(mockOnBook).toHaveBeenCalledTimes(3);
    });
});

/**
 * Example: Testing a Form Component
 */

// Mock BookingForm component
const BookingForm = ({ onSubmit }: any) => {
    const [formData, setFormData] = React.useState({
        email: '',
        phone: '',
        seats: 1,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
            />

            <label htmlFor="phone">Phone</label>
            <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
            />

            <label htmlFor="seats">Number of Seats</label>
            <input
                id="seats"
                type="number"
                min="1"
                max="10"
                value={formData.seats}
                onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
            />

            <button type="submit">Submit Booking</button>
        </form>
    );
};

describe('BookingForm Component', () => {
    test('should submit form with valid data', async () => {
        // Arrange
        const mockOnSubmit = jest.fn();
        const user = userEvent.setup();

        // Act
        render(<BookingForm onSubmit={mockOnSubmit} />);

        // Fill out the form
        await user.type(screen.getByLabelText(/email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/phone/i), '9876543210');
        await user.clear(screen.getByLabelText(/number of seats/i));
        await user.type(screen.getByLabelText(/number of seats/i), '3');

        // Submit
        await user.click(screen.getByRole('button', { name: /submit booking/i }));

        // Assert
        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith({
                email: 'test@example.com',
                phone: '9876543210',
                seats: 3,
            });
        });
    });

    test('should have default value of 1 seat', () => {
        // Arrange & Act
        render(<BookingForm onSubmit={jest.fn()} />);

        // Assert
        const seatsInput = screen.getByLabelText(/number of seats/i) as HTMLInputElement;
        expect(seatsInput.value).toBe('1');
    });

    test('should clear and re-fill form fields', async () => {
        // Arrange
        const user = userEvent.setup();

        // Act
        render(<BookingForm onSubmit={jest.fn()} />);

        const emailInput = screen.getByLabelText(/email/i);

        // Type, clear, and type again
        await user.type(emailInput, 'first@example.com');
        await user.clear(emailInput);
        await user.type(emailInput, 'second@example.com');

        // Assert
        expect(emailInput).toHaveValue('second@example.com');
    });
});

/**
 * TO USE THESE TESTS IN YOUR PROJECT:
 * 
 * 1. Install required dependencies (already done):
 *    pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
 * 
 * 2. Create your actual component files:
 *    - src/components/EventCard.tsx
 *    - src/components/BookingForm.tsx
 * 
 * 3. Create test files next to components:
 *    - src/components/EventCard.test.tsx
 *    - src/components/BookingForm.test.tsx
 * 
 * 4. Import and test your real components
 * 
 * 5. Run tests:
 *    cd apps/web
 *    pnpm test
 */
