import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

export async function POST(req: NextRequest) {
    try {
        let path = req.nextUrl.pathname.replace("/api/post/", "");
        path = path.replace(/\*/g, "/");
        const url = API_URL;
        const data = await req.json();
        console.log('Trying to POST data from: ', url + path);
        const apiReq = await fetch(url + path, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json',
            },
        });
        const apiRes = await apiReq.json();
        return NextResponse.json(apiRes);
    } catch (e) {
        console.log(e);
        return NextResponse.json({ error: 1 });
    }
}