import { describe, it, expect, afterEach, vi, Mock } from 'vitest';
import { IUserRegister } from '@/interfaces';
import jwt from 'jsonwebtoken';
import { TokenExpiredError, JsonWebTokenError, NotBeforeError } from 'jsonwebtoken';
import { createToken, getInfoFromToken } from '@/utils';

vi.mock('jsonwebtoken', () => ({
    sign: vi.fn(),
    verify: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
    system: vi.fn(),
    error: vi.fn(),
}));

describe('Auth Functions', () => {
    const mockUser: IUserRegister = {
        username: 'testUser',
        email: 'test@example.com',
        password: 'password123',
        companyName: 'TestCompany'
    };

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('createToken', () => {
        it('should create a valid JWT token', () => {
            const mockToken = 'mockToken';
            (jwt.sign as Mock).mockReturnValue(mockToken);

            const token = createToken(mockUser);

            expect(jwt.sign).toHaveBeenCalledWith({
                username: mockUser.username,
                email: mockUser.email,
                password: mockUser.password,
                companyName: mockUser.companyName
            }, expect.any(String), { expiresIn: expect.any(String) });

            expect(token).toBe(mockToken);
        });
    });

    describe('getInfoFromToken', () => {
        it('should return user info when token is valid', () => {
            (jwt.verify as Mock).mockReturnValue(mockUser);

            const result = getInfoFromToken('validToken');

            expect(jwt.verify).toHaveBeenCalledWith('validToken', expect.any(String));
            expect(result.userInfo).toEqual(mockUser);
            expect(result.errorType).toBeNull();
        });

        it('should handle TokenExpiredError', () => {
            (jwt.verify as Mock).mockImplementation(() => {
                throw new TokenExpiredError('jwt expired', new Date());
            });

            const result = getInfoFromToken('expiredToken');

            expect(result.errorType).toBe('Token Expired Error');
            expect(result.userInfo).toBeNull();
        });

        it('should handle JsonWebTokenError', () => {
            (jwt.verify as Mock).mockImplementation(() => {
                throw new JsonWebTokenError('invalid token');
            });

            const result = getInfoFromToken('invalidToken');

            expect(result.errorType).toBe('Json Web Token Error');
            expect(result.userInfo).toBeNull();
        });

        it('should handle NotBeforeError', () => {
            (jwt.verify as Mock).mockImplementation(() => {
                throw new NotBeforeError('jwt not active', new Date());
            });

            const result = getInfoFromToken('notBeforeToken');

            expect(result.errorType).toBe('Not Before Error');
            expect(result.userInfo).toBeNull();
        });

        it('should handle unknown errors', () => {
            (jwt.verify as Mock).mockImplementation(() => {
                throw new Error('Unknown error');
            });

            const result = getInfoFromToken('unknownErrorToken');

            expect(result.errorType).toBe('Unknown Error');
            expect(result.userInfo).toBeNull();
        });
    });
});
