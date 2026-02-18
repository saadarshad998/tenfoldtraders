const supabase = window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
);

document.getElementById("logoutBtn").addEventListener("click", async () => {
    await supabase.auth.signOut();

    // clear any cached session
    localStorage.clear();
    sessionStorage.clear();

    // go back to login
    window.location.href = "/login.html";
});
