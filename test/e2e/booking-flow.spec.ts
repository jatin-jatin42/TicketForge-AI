import { test, expect } from '@playwright/test';

/**
 * E2E tests for TicketForge AI
 */

test.describe('Event Booking Flow - E2E', () => {

    test.beforeEach(async ({ page }) => {
        // Increase timeout for slow compilation
        test.setTimeout(300000);

        // Mock Razorpay script loading
        await page.route('https://checkout.razorpay.com/v1/checkout.js', async route => {
            const mockScript = `
                window.Razorpay = function(options) {
                    this.open = async function() {
                        console.log("Mock Razorpay Open called", options);
                        
                        const secret = "nsvMGSqcd5pEQAeHklW6LodR"; // Test secret from env
                        const paymentId = "pay_mock_" + Date.now();
                        const orderId = options.order_id;
                        
                        // Generate Signature using Web Crypto API to match backend expectation
                        const enc = new TextEncoder();
                        const algorithm = { name: "HMAC", hash: "SHA-256" };
                        const key = await crypto.subtle.importKey(
                            "raw", 
                            enc.encode(secret), 
                            algorithm, 
                            false, 
                            ["sign"]
                        );
                        const data = enc.encode(orderId + "|" + paymentId);
                        const signatureBuffer = await crypto.subtle.sign(algorithm.name, key, data);
                        const signature = Array.from(new Uint8Array(signatureBuffer))
                            .map(b => b.toString(16).padStart(2, '0'))
                            .join('');

                        // Call Success Handler immediately
                        if (options.handler) {
                            options.handler({
                                razorpay_order_id: orderId,
                                razorpay_payment_id: paymentId,
                                razorpay_signature: signature
                            });
                        }
                    };
                };
            `;

            await route.fulfill({
                status: 200,
                contentType: 'text/javascript',
                body: mockScript
            });
        });

        // Navigate to homepage
        await page.goto('/');

        // Inject style to disable transitions and animations to make Playwright clicks more reliable
        await page.addStyleTag({
            content: `
                *, *::before, *::after {
                    transition: none !important;
                    animation-duration: 0s !important;
                    animation-iteration-count: 1 !important;
                }
            `
        });
    });

    test('should complete full booking journey successfully', async ({ page }) => {
        // Step 1: Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'user@tf.com');
        await page.fill('input[type="password"]', '12345678');
        await page.click('button:has-text("Sign In")');
        await expect(page).toHaveURL(/.*dashboard|.*events/, { timeout: 60000 });

        // Step 2: Navigate to events
        await page.goto('/events');
        await expect(page.getByRole('heading', { name: /All Events|Upcoming Events/i })).toBeVisible({ timeout: 60000 });

        // Step 3: Select Taylor Swift event
        const eventLink = page.locator('text=Taylor Swift - Eras Tour').first();
        await expect(eventLink).toBeVisible({ timeout: 60000 });
        await eventLink.click();

        // Step 4: Verify details page
        await expect(page).toHaveURL(/\/events\/[a-zA-Z0-9-]+/, { timeout: 60000 });

        // Step 5: Go to booking page
        await page.click('text=Select Seats');
        await expect(page).toHaveURL(/\/events\/.*\/book/, { timeout: 60000 });

        // Step 6: Select a seat
        // Wait for map to settle
        await page.waitForTimeout(3000);
        const seat = page.locator('g[role="button"][aria-label*="Seat"][aria-disabled="false"]').first();
        await expect(seat).toBeVisible({ timeout: 90000 });

        // Dispatch click event directly to avoid hit-testing issues with transforms
        await seat.dispatchEvent('click');

        // Verify the seat is visually selected (turns to fill-primary)
        const seatRect = seat.locator('rect');
        await expect(seatRect).toHaveClass(/\bfill-primary\b(?!\/)/, { timeout: 30000 });

        // Step 7: Verify price updates in summary
        const priceElement = page.getByTestId('total-price');
        await expect(priceElement).toBeVisible({ timeout: 30000 });
        // Using a more flexible check for the price text (must not be zero)
        await expect(priceElement).not.toHaveText(/^₹0(\.00)?$/);

        // Step 8: Proceed to checkout
        await page.click('button:has-text("Checkout Now")');

        // Step 9: Verify checkout page
        await expect(page).toHaveURL(/\/checkout/, { timeout: 60000 });

        // Step 10: Fill in phone number
        await page.fill('input[type="tel"]', '9876543210');

        // Step 11: Click "Pay Now" button
        await page.click('button:has-text("Pay Now")');

        // Step 12: Verify booking confirmation
        await expect(page).toHaveURL(/\/tickets/, { timeout: 90000 });
        await expect(page.getByRole('heading', { name: /My Tickets/i })).toBeVisible({ timeout: 60000 });
    });

    test('should prevent booking without selecting seats', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'user@tf.com');
        await page.fill('input[type="password"]', '12345678');
        await page.click('button:has-text("Sign In")');

        await page.goto('/events');
        await page.locator('text=Taylor Swift - Eras Tour').first().click();
        await page.click('text=Select Seats');
        await expect(page).toHaveURL(/\/events\/.*\/book/, { timeout: 60000 });

        await expect(page.getByText('Your Selection')).toBeVisible({ timeout: 60000 });
        const checkoutButton = page.locator('button:has-text("Checkout Now")');
        await expect(checkoutButton).not.toBeVisible();
    });

    test('should handle seat selection and deselection', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'user@tf.com');
        await page.fill('input[type="password"]', '12345678');
        await page.click('button:has-text("Sign In")');

        await page.goto('/events');
        await page.locator('text=Taylor Swift - Eras Tour').first().click();
        await page.click('text=Select Seats');

        await page.waitForTimeout(3000);
        const seatA1 = page.locator('g[role="button"][aria-label*="Seat"][aria-disabled="false"]').first();
        const seatA2 = page.locator('g[role="button"][aria-label*="Seat"][aria-disabled="false"]').nth(1);

        // Select seat 1
        await seatA1.dispatchEvent('click');
        await expect(seatA1.locator('rect')).toHaveClass(/\bfill-primary\b(?!\/)/, { timeout: 30000 });

        // Select seat 2
        await seatA2.dispatchEvent('click');
        await expect(seatA2.locator('rect')).toHaveClass(/\bfill-primary\b(?!\/)/, { timeout: 30000 });

        // Deselect seat 1
        await seatA1.dispatchEvent('click');
        // Check for absence of THE direct fill-primary class (ignoring the hover: version)
        await expect(seatA1.locator('rect')).not.toHaveClass(/\bfill-primary\b(?!\/)/, { timeout: 30000 });

        // Seat 2 should stay selected
        await expect(seatA2.locator('rect')).toHaveClass(/\bfill-primary\b(?!\/)/, { timeout: 30000 });
    });

    test('should update price dynamically as seats are selected', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'user@tf.com');
        await page.fill('input[type="password"]', '12345678');
        await page.click('button:has-text("Sign In")');

        await page.goto('/events');
        await page.locator('text=Taylor Swift - Eras Tour').first().click();
        await page.click('text=Select Seats');

        await page.waitForTimeout(3000);
        const priceDisplay = page.getByTestId('total-price');

        // Use aria-disabled="false" to avoid clicking already booked seats from previous tests
        const seat1 = page.locator('g[role="button"][aria-label*="Seat"][aria-disabled="false"]').first();
        await seat1.dispatchEvent('click');

        await expect(priceDisplay).toBeVisible({ timeout: 30000 });
        const firstPriceText = await priceDisplay.innerText();
        const firstVal = parseInt(firstPriceText.replace(/[^0-9]/g, ''));

        const seat2 = page.locator('g[role="button"][aria-label*="Seat"][aria-disabled="false"]').nth(1);
        await seat2.dispatchEvent('click');

        await expect(async () => {
            const secondPriceText = await priceDisplay.innerText();
            const secondVal = parseInt(secondPriceText.replace(/[^0-9]/g, ''));
            expect(secondVal).toBeGreaterThan(firstVal);
        }).toPass({ timeout: 30000 });
    });
});
