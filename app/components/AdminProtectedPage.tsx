"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, isLoggedIn } from "../lib/revora-auth";

type AdminProtectedPageProps = {
children: React.ReactNode;
};

const ADMIN_EMAILS = ["taffinquentin.qt@gmail.com"];

export default function AdminProtectedPage({
children,
}: AdminProtectedPageProps) {
const router = useRouter();
const [allowed, setAllowed] = useState(false);

useEffect(() => {
if (!isLoggedIn()) {
router.push("/login");
return;
}

const session = getSession();

if (!session) {
router.push("/login");
return;
}

const isAdmin = ADMIN_EMAILS.includes(session.email.toLowerCase());

if (!isAdmin) {
router.push("/dashboard");
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
