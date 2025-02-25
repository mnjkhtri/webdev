import "server-only";

import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.API_KEY;
const API_URL = process.env.API_URL;

export async function DELETE(req: NextRequest) {
    try {
        let path = req.nextUrl.pathname.replace("/api/delete/", "") + "?" + req.nextUrl.searchParams.toString();
        path = path.replace(/\*/g, "/");;

        const url = API_URL;
        console.log('Trying to DELETE data from: ', url + path);
        const apiReq = await fetch(url + path, {
            method: 'DELETE',
            headers: {
                'x-api-key': API_KEY
            },
        });
        if (apiReq.status != 204) {
            throw new Error("Error deleting data");
        }
        return NextResponse.json({ error: 0, msg: "Data deleted successfully" });
    } catch (e) {
        console.log(e);
        return NextResponse.json({ error: 1, msg: "Error deleting data" });
    }
}