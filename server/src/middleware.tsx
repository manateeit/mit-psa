import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { authorizationMiddleware } from './middleware/authorizationMiddleware';
import './lib/init/serverInit';  // Import server initialization

export default withAuth(
  async function middleware(req) {    
    if (!req.nextauth.token) {
      console.log("No token found");
      return NextResponse.redirect(new URL('/signin', req.url));
    }
    
    console.log("*** Token found");  

    const authorizationResult = await authorizationMiddleware(req);
    if (authorizationResult.status === 403) {
      return NextResponse.rewrite(new URL("/Denied", req.url));
    }

    // Extract tenant ID from the token
    const tenantId = req.nextauth.token.tenant as string;

    // Create a new response
    const response = NextResponse.next();

    // Add custom headers
    response.headers.set('X-Cleanup-Connection', tenantId);
    response.headers.set('x-tenant-id', tenantId);

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = { matcher: ["/msp/:path*"] };
