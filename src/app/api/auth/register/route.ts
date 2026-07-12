import { NextRequest } from 'next/server';
import { AuthService } from '@/modules/auth/services';
import { registerSchema } from '@/modules/auth/schemas';
import { successResponse, errorResponse } from '@/modules/core/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validatedData = registerSchema.parse(body);
    
    // Execute domain logic
    const result = await AuthService.registerOrganization(validatedData);
    
    return successResponse(result, 'Organization registered successfully', 201);
  } catch (error) {
    return errorResponse(error);
  }
}
