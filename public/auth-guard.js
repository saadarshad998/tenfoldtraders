import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
);

// Protect page
const { data: { session } } = await supabase.auth.getSession();

if (!session && location.pathname !== "/login.html") {
    location.href = "/login.html";
    throw new Error("Redirecting to login");
}

// ⭐ SHOW PAGE AFTER AUTH
document.documentElement.style.display = "block";

// Logout button support
window.logout = async () => {
    await supabase.auth.signOut();
    location.href = "/login.html";
};
