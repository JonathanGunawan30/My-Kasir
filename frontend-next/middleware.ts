import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const token = request.cookies.get('X-API-TOKEN')?.value

    const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
    const isProtectedPage = request.nextUrl.pathname.startsWith('/admin')

    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }

    if (!token && isProtectedPage) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/auth/:path*',
        '/admin/:path*',
    ],
}
