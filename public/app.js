const chat = document.getElementById("chat");
const input = document.getElementById("question");
const sendBtn = document.getElementById("send");
const clearBtn = document.getElementById("clear");
let addMode = false;


const sessionId = localStorage.sessionId ??= crypto.randomUUID();
let originalCar = null;
let isDirty = false;

const updateBtn = document.getElementById("updateBtn");

function collectFormData() {
    const data = {};

    carForm.querySelectorAll("input").forEach(el => {

        if (el.type === "radio") {
            if (el.checked) data.status = el.value;
            return;
        }

        if (el.id === "new_registration") return;

        let value = el.value.trim();

        if (value === "") value = null;

        data[el.id] = value;
    });

    return data;
}

async function loadRegistrations() {
    const ownerId = ownerSelect.value;
    if (!ownerId) return;

    const res = await fetch(`/cars/by-owner/${ownerId}`);
    const cars = await res.json();

    regSelect.innerHTML = `<option value="__none__">— Select registration —</option>`;

        cars.forEach(car => {
            const opt = document.createElement("option");
            opt.value = car.registration;

            const make = car.make ?? "";
            const model = car.model ?? "";

            const suffix = (make || model)
                ? ` (${make} ${model})`.trim()
                : "";

            opt.textContent = car.registration + " " + suffix;

            regSelect.appendChild(opt);
        });


    const add = document.createElement("option");
    add.value = "__add__";
    add.textContent = "Add Vehicle...";
    regSelect.appendChild(add);
}


function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = "msg " + type;
    div.textContent = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function clearCarFields() {
    const inputs = carForm.querySelectorAll("input");
    inputs.forEach(input => {
        if (input.type === "radio") {
            input.checked = false;
        } else {
            input.value = "";
        }
    });
}

async function exitAddMode() {

    addMode = false;
    originalCar = null;
    isDirty = false;

    document.getElementById("newRegField").style.display = "none";
    document.getElementById("cancelAddBtn").style.display = "none";
    updateBtn.style.display = "none";

    clearCarFields();

    await loadRegistrations();
    regSelect.value = "__none__";
}



async function sendMessage() {
    const question = input.value.trim();
    if (!question) return;

    addMessage("You: " + question, "user");
    input.value = "";

    const thinking = document.createElement("div");
    thinking.className = "msg bot";
    thinking.textContent = "Assistant is thinking...";
    chat.appendChild(thinking);
    chat.scrollTop = chat.scrollHeight;

    try {
        const res = await fetch("/ask", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({ question, sessionId })
        });

        const data = await res.json();

        thinking.remove();
        addMessage("Assistant: " + data.answer, "bot");

    } catch (err) {
        thinking.textContent = "Server error";
    }
}

// click send
sendBtn.onclick = sendMessage;

// press Enter
input.addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
});

// clear chat
clearBtn.onclick = () => {
    chat.innerHTML = "";
    localStorage.sessionId = crypto.randomUUID();
};


const ownerSelect = document.getElementById("ownerSelect");
const regSelect = document.getElementById("regSelect");
const carForm = document.getElementById("carForm");

ownerSelect.addEventListener("change", async () => {

    const ownerId = ownerSelect.value;

    clearCarFields();
    originalCar = null;
    isDirty = false;
    updateBtn.style.display = "none";

    if (!ownerId) {
        carForm.style.display = "none";
        return;
    }

    carForm.style.display = "block";

    const res = await fetch(`/cars/by-owner/${ownerId}`);
    const cars = await res.json();   // ✅ MUST be cars array

    // reset dropdown
    regSelect.innerHTML = `
        <option value="" selected disabled hidden>Select registration</option>
    `;

    cars.forEach(car => {
        const opt = document.createElement("option");
        opt.value = car.registration;

        const make = car.make ?? "";
        const model = car.model ?? "";

        const suffix = (make || model)
            ? ` (${make} ${model})`.trim()
            : "";

        opt.textContent = car.registration + " " + suffix;

        regSelect.appendChild(opt);
    });


    // add vehicle option
    const add = document.createElement("option");
    add.value = "__add__";
    add.textContent = "Add Vehicle...";
    regSelect.appendChild(add);
});


regSelect.addEventListener("change", async () => {

    const reg = regSelect.value;

        addMode = false;
    document.getElementById("cancelAddBtn").style.display = "none";
    document.getElementById("newRegField").style.display = "none";
    updateBtn.style.display = "none";

if (reg === "__add__") {

    addMode = true;
    originalCar = null;
    isDirty = false;

    clearCarFields();

    document.getElementById("newRegField").style.display = "block";
    document.getElementById("cancelAddBtn").style.display = "inline-block";

    carForm.querySelectorAll("input").forEach(i => i.removeAttribute("readonly"));

    updateBtn.textContent = "Add";
    updateBtn.style.display = "block";

    return;
}





    // NORMAL VEHICLE MODE
    document.getElementById("newRegField").style.display = "none";

    const res = await fetch(`/cars/${reg}`);
const car = await res.json();

Object.keys(car).forEach(key => {
    const el = document.getElementById(key);
    if (el) el.value = car[key] ?? "";
});

originalCar = structuredClone(car);   // ⭐ IMPORTANT
isDirty = false;
updateBtn.style.display = "none";

updateBtn.textContent = "Update";

carForm.querySelectorAll("input").forEach(i => {
    if (i.id === "make" || i.id === "model")
        i.setAttribute("readonly", true);
});


// set status radios
const statusRadio = document.querySelector(`input[name="status"][value="${car.status}"]`);
if (statusRadio) statusRadio.checked = true;

});


// ================= INPUT VALIDATION =================

// integers only
document.querySelectorAll('[data-type="int"]').forEach(input => {
    input.addEventListener("input", () => {
        input.value = input.value.replace(/[^\d]/g, "");
    });
});

// decimals (money)
document.querySelectorAll('[data-type="decimal"]').forEach(input => {
    input.addEventListener("input", () => {
        // allow digits + single dot
        let val = input.value.replace(/[^\d.]/g, "");

        // prevent multiple dots
        const parts = val.split(".");
        if (parts.length > 2)
            val = parts[0] + "." + parts.slice(1).join("");

        input.value = val;
    });
});

document.querySelectorAll('[data-type="decimal"]').forEach(input => {
    input.addEventListener("blur", () => {
        if (input.value !== "")
            input.value = parseFloat(input.value).toFixed(2);
    });
});

// ================= CHANGE DETECTION =================

function detectChanges() {
    if (!originalCar) return;

    isDirty = false;

    // check inputs
    const inputs = carForm.querySelectorAll("input");

    inputs.forEach(el => {

        if (el.id === "make" || el.id === "model") return;

        if (el.type === "radio") {
            const selected = document.querySelector('input[name="status"]:checked');
            const current = selected ? selected.value : "";
            if (current !== originalCar.status)
                isDirty = true;
        }
        else if (originalCar.hasOwnProperty(el.id)) {
            const current = el.value ?? "";
            const original = originalCar[el.id] ?? "";
            if (current.toString() !== original.toString())
                isDirty = true;
        }
    });

    updateBtn.style.display = isDirty ? "block" : "none";
}

carForm.addEventListener("input", detectChanges);
carForm.addEventListener("change", detectChanges);

updateBtn.addEventListener("click", async () => {

    /* ================= CREATE ================= */
/* ================= CREATE ================= */
if (addMode) {

    const data = collectFormData();

    data.registration = newRegInput.value.trim();
    data.owner_id = ownerSelect.value;

    // ===== REQUIRED FIELD VALIDATION =====
    const missing = [];

    if (!data.registration) missing.push("Registration");
    if (!data.make) missing.push("Make");
    if (!data.model) missing.push("Model");
    if (!data.status) missing.push("Status");
    if (!data.purchase_date) missing.push("Purchase Date");

    // reset borders
    const resetBorder = id => {
        const el = document.getElementById(id);
        if (el) el.style.borderColor = "#262c38";
    };

    resetBorder("new_registration");
    resetBorder("make");
    resetBorder("model");
    resetBorder("purchase_date");

    // highlight missing
    if (!data.registration) document.getElementById("new_registration").style.borderColor = "#ff4d4d";
    if (!data.make) document.getElementById("make").style.borderColor = "#ff4d4d";
    if (!data.model) document.getElementById("model").style.borderColor = "#ff4d4d";
    if (!data.purchase_date) document.getElementById("purchase_date").style.borderColor = "#ff4d4d";

    if (missing.length) {
        alert("Please fill in required fields:\n\n" + missing.join("\n"));
        return;
    }

    // confirmation
    if (!confirm("Create this vehicle?")) return;

    // send to server
    await fetch("/cars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    alert("Vehicle added");

    await exitAddMode();
    return;
}


    /* ================= UPDATE ================= */

    if (!isDirty) return;
    if (!confirm("Are you sure you want to update this car?")) return;

    const data = collectFormData();

    await fetch(`/cars/${regSelect.value}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    alert("Vehicle updated");

    originalCar = structuredClone(data);
    isDirty = false;
    updateBtn.style.display = "none";
});


const newRegInput = document.getElementById("new_registration");

newRegInput.addEventListener("input", () => {

    let value = newRegInput.value.toUpperCase();

    // allow letters numbers and ONE space
    value = value.replace(/[^A-Z0-9 ]/g, "");

    // collapse multiple spaces
    value = value.replace(/\s+/g, " ");

    // max 7 chars excluding space
    const noSpace = value.replace(/\s/g, "");
    if (noSpace.length > 7)
        value = noSpace.substring(0,7);

    newRegInput.value = value;
});


document.getElementById("cancelAddBtn").onclick = exitAddMode;
