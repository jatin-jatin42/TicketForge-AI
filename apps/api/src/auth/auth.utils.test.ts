import jwt from 'jsonwebtoken';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from './auth.utils';

// Mock the env config
jest.mock('../config/env', () => ({
    env: {
        JWT_ACCESS_SECRET: 'test_access_secret',
        JWT_REFRESH_SECRET: 'test_refresh_secret',
        JWT_ACCESS_EXPIRY: '15m',
        JWT_REFRESH_EXPIRY: '7d',
    },
}));

describe('Auth Utils - JWT Functions', () => {
    describe('signAccessToken', () => {
        test('should create a valid access token', () => {
            const payload = {
                id: 'user-123',
                role: 'USER' as const,
            };

            const token = signAccessToken(payload);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
        });

        test('should include correct payload in token', () => {
            const payload = {
                id: 'user-456',
                role: 'ADMIN' as const,
            };

            const token = signAccessToken(payload);
            const decoded = jwt.decode(token) as any;

            expect(decoded.id).toBe('user-456');
            expect(decoded.role).toBe('ADMIN');
        });

        test('should set expiry time', () => {
            const payload = {
                id: 'user-789',
                role: 'USER' as const,
            };

            const token = signAccessToken(payload);
            const decoded = jwt.decode(token) as any;

            expect(decoded.exp).toBeDefined();
            expect(decoded.iat).toBeDefined();

            // Token should expire in the future
            expect(decoded.exp).toBeGreaterThan(decoded.iat);
        });
    });

    describe('signRefreshToken', () => {
        test('should create a valid refresh token', () => {
            const payload = {
                id: 'user-123',
            };

            const token = signRefreshToken(payload);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3);
        });

        test('should include correct payload in refresh token', () => {
            const payload = {
                id: 'user-999',
            };

            const token = signRefreshToken(payload);
            const decoded = jwt.decode(token) as any;

            expect(decoded.id).toBe('user-999');
        });

        test('should have longer expiry than access token', () => {
            const payload = { id: 'user-123' };

            const accessToken = signAccessToken({
                id: 'user-123',
                role: 'USER' as const,
            });
            const refreshToken = signRefreshToken(payload);

            const accessDecoded = jwt.decode(accessToken) as any;
            const refreshDecoded = jwt.decode(refreshToken) as any;

            // Refresh token should expire later than access token
            expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
        });
    });

    describe('verifyAccessToken', () => {
        test('should verify and decode valid access token', () => {
            const payload = {
                id: 'user-123',
                role: 'USER' as const,
            };

            const token = signAccessToken(payload);
            const verified = verifyAccessToken(token);

            expect(verified.id).toBe('user-123');
            expect(verified.role).toBe('USER');
        });

        test('should throw error for invalid token', () => {
            const invalidToken = 'invalid.token.here';

            expect(() => verifyAccessToken(invalidToken)).toThrow();
        });

        test('should throw error for token with wrong secret', () => {
            // Sign with different secret
            const token = jwt.sign(
                { id: 'user-123', role: 'USER' },
                'wrong_secret',
                { expiresIn: '15m' }
            );

            expect(() => verifyAccessToken(token)).toThrow();
        });

        test('should throw error for expired token', (done) => {
            // Create token that expires immediately
            const token = jwt.sign(
                { id: 'user-123', role: 'USER' },
                'test_access_secret',
                { expiresIn: '1ms' }
            );

            // Wait a bit to ensure expiry
            setTimeout(() => {
                try {
                    expect(() => verifyAccessToken(token)).toThrow();
                    done();
                } catch (error) {
                    done(error);
                }
            }, 10);
        });
    });

    describe('verifyRefreshToken', () => {
        test('should verify and decode valid refresh token', () => {
            const payload = { id: 'user-456' };

            const token = signRefreshToken(payload);
            const verified = verifyRefreshToken(token);

            expect(verified.id).toBe('user-456');
        });

        test('should throw error for invalid refresh token', () => {
            const invalidToken = 'invalid.refresh.token';

            expect(() => verifyRefreshToken(invalidToken)).toThrow();
        });

        test('should throw error for access token used as refresh token', () => {
            // Create access token
            const accessToken = signAccessToken({
                id: 'user-123',
                role: 'USER' as const,
            });

            // Try to verify it as refresh token (should fail - different secret)
            expect(() => verifyRefreshToken(accessToken)).toThrow();
        });
    });

    describe('Token Security', () => {
        test('should create different tokens for same payload', (done) => {
            const payload = {
                id: 'user-123',
                role: 'USER' as const,
            };

            const token1 = signAccessToken(payload);

            // Wait a tiny bit to ensure different iat (issued at)
            setTimeout(() => {
                try {
                    const token2 = signAccessToken(payload);

                    // Tokens should be different due to different iat
                    expect(token1).not.toBe(token2);
                    done();
                } catch (error) {
                    done(error);
                }
            }, 1100); // JWT sub-second iat is not always unique, wait > 1s for guaranteed difference
        });

        test('should not be able to decode token without secret', () => {
            const payload = {
                id: 'user-123',
                role: 'USER' as const,
            };

            const token = signAccessToken(payload);

            // jwt.decode works without secret but doesn't verify
            const decoded = jwt.decode(token);
            expect(decoded).toBeDefined();

            // But verification requires secret
            expect(() => jwt.verify(token, 'wrong_secret')).toThrow();
        });
    });

    describe('Edge Cases', () => {
        test('should handle very long user IDs', () => {
            const payload = {
                id: 'a'.repeat(100),
                role: 'USER' as const,
            };

            const token = signAccessToken(payload);
            const verified = verifyAccessToken(token);

            expect(verified.id).toBe('a'.repeat(100));
        });

        test('should handle different roles', () => {
            const roles = ['USER', 'ADMIN'] as const;

            roles.forEach(role => {
                const payload = {
                    id: 'user-123',
                    role,
                };

                const token = signAccessToken(payload);
                const verified = verifyAccessToken(token);

                expect(verified.role).toBe(role);
            });
        });
    });
});
