import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

document.addEventListener("DOMContentLoaded", () => {

  const supabase = createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );

  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Login failed: " + error.message);
      return;
    }

    // success → go to app
    window.location.href = "/";
  });

});
