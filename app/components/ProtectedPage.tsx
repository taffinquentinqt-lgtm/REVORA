"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "../lib/revora-auth";

type ProtectedPageProps = {
children: React.ReactNode;
};

export default function ProtectedPage({ children }: ProtectedPageProps) {
const router = useRouter();
const [allowed, setAllowed] = useState(false);

useEffect(() => {
if (!isLoggedIn()) {
router.push("/login");
return;
}

setAllowed(true);
}, [router]);

if (!allowed) {
return (
<main className="min-h-screen bg-slate-950 text-white">
<div className="flex min-h-screen items-center justify-center">
<p className="text-white/60">Chargement...</p>
</div>
</main>
);
}

return <>{children}</>;
}
