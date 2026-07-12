import { NextRequest } from 'next/server';
import { AuthService } from '@/modules/auth/services';
import { loginSchema } from '@/modules/auth/schemas';
import { successResponse, errorResponse } from '@/modules/core/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validatedData = loginSchema.parse(body);
    
    // Execute domain logic
    const result = await AuthService.login(validatedData);
    
    // In a real application, you'd also set HttpOnly cookies here via next/headers
    // import { cookies } from 'next/headers';
    // cookies().set('token', result.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    return successResponse(result, 'Login successful');
  } catch (error) {
    return errorResponse(error);
  }
}
