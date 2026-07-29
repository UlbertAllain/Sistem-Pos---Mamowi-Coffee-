import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code = 'BAD_REQUEST',
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function jsonError(cause: unknown): NextResponse {
  if (cause instanceof HttpError) {
    return NextResponse.json(
      { error: { code: cause.code, message: cause.message } },
      { status: cause.status },
    );
  }
  if (cause instanceof ZodError) {
    return NextResponse.json(
      { error: { code: 'INVALID_PAYLOAD', message: 'Data permintaan tidak valid.' } },
      { status: 400 },
    );
  }

  const message = cause instanceof Error ? cause.message : 'Terjadi kesalahan server.';
  const configurationError = message.includes('Environment variable server');
  return NextResponse.json(
    {
      error: {
        code: configurationError ? 'SERVER_NOT_CONFIGURED' : 'INTERNAL_ERROR',
        message: configurationError
          ? 'Firebase Admin belum dikonfigurasi pada server.'
          : 'Transaksi tidak dapat diproses. Periksa log server.',
      },
    },
    { status: configurationError ? 503 : 500 },
  );
}
