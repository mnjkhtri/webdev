import "server-only";

import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

export async function GET(req: NextRequest) {
    try {
        let path = req.nextUrl.pathname.replace("/api/get/", "") + "?" + req.nextUrl.searchParams.toString();
        path = path.replace(/\*/g, "/");;

        const url = API_URL;
        console.log('Trying to GET data from: ', url + path);
        const apiReq = await fetch(url + path, {
            headers: {
                'x-api-key': API_KEY
            },
        });
        const apiRes = await apiReq.json();
        return NextResponse.json(apiRes);
    } catch (e) {
        console.log(e);
        return NextResponse.json({ error: 1, msg: "Error fetching data" });
    }
}