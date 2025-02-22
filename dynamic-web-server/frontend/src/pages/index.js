import { useEffect, useState } from 'react';

export default function Home() {
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('http://localhost:5000/api/hello')
            .then(res => res.json())
            .then(data => setMessage(data.message));
    }, []);

    return (
        <div>
            <h1>Next.js + Flask</h1>
            <p>{message}</p>
        </div>
    );
}