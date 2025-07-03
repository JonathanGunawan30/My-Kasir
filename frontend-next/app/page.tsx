'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home(){
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('X-API-TOKEN')
        const lastPage = localStorage.getItem('last_page')

        if(token){
            router.replace(lastPage || '/admin/dashboard')
        } else {
            router.replace('/auth/login')
        }
    }, [router]);

    return null;
}