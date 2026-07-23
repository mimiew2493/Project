import { NextRequest, NextResponse } from "next/server";

import { createProgram } from "@/src/services/program.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await createProgram(body);

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 400,
      },
    );
  }
}
