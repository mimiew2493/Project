import { NextResponse } from "next/server";
import { createUser } from "@/src/services/user.service";


export async function POST(req: Request) {

  try {

    const data = await req.json();

    const result = await createUser(data);

    return NextResponse.json({
      message: "User created",
      users_id: result
    });

  } catch(error:any){

    return NextResponse.json(
      {
        error:error.message
      },
      {
        status:500
      }
    );

  }

}
