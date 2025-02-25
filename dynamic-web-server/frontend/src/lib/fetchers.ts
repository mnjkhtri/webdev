'use client';

async function getData(path: string) {
    try {
        path = path.replace(/\//g, "*");
        const apiReq = await fetch('/api/get/' + path);
        const apiRes = await apiReq.json();
        return apiRes;
    } catch (e) {
        console.log(e);
        console.log('Fetcher error');
        return {};
    }
}

async function postData(path: string, data: Record<string, unknown>) {
    try {
        path = path.replace(/\//g, "*");

        const apiReq = await fetch('/api/post/' + path, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const apiRes = await apiReq.json();
        return apiRes;
    } catch (e) {
        console.log(e);
        console.log('Fetcher error');
        return {};
    }
}

async function putData(path: string, data: Record<string, unknown>) {
    try {
        path = path.replace(/\//g, "*");

        const apiReq = await fetch('/api/put/' + path, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const apiRes = await apiReq.json();
        return apiRes;
    } catch (e) {
        console.log(e);
        console.log('Fetcher error');
        return {};
    }
}

async function deleteData(path: string) {
    try {
        path = path.replace(/\//g, "*");
        const apiReq = await fetch('/api/delete/' + path, {
            method: 'DELETE'
        });
        const apiRes = await apiReq.json();
        return apiRes;
    } catch (e) {
        console.log(e);
        console.log('Fetcher error');
        return {};
    }
}

export { getData, postData, putData, deleteData };