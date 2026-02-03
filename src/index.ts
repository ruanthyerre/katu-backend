import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import appointmentsRoutes from "./routes/appointments";
import patientsRoutes from "./routes/patients";
import professionalsRoutes from "./routes/professionals";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "./middleware/authMiddleware";

dotenv.config();
const app = express();
app.use(express.json());

const prisma = new PrismaClient();

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "katu-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/professionals", professionalsRoutes);

/**
 * Demo UI page for quick manual testing.
 * - Login -> /api/me to get user id -> create patient/professional -> create appointment
 *
 * Exposed both at /demo (local) and /api/demo (routed through Traefik to backend).
 */
function demoHtml() {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Katu Demo</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 900px; margin: 24px auto; padding: 0 12px; }
    fieldset { margin-bottom: 16px; }
    input[type=text], input[type=password], input[type=datetime-local] { width: 100%; padding: 8px; box-sizing: border-box; margin-top:6px; }
    button { padding: 8px 12px; margin-top: 8px; }
    pre { background:#f6f8fa; padding:12px; overflow:auto; }
    label { font-weight:600; }
  </style>
</head>
<body>
  <h1>Katu — Demo UI</h1>

  <fieldset>
    <legend>Login</legend>
    <label>Email</label>
    <input id="email" type="text" value="thyerrefilho@gmail.com" />
    <label>Senha</label>
    <input id="password" type="password" value="2009@Benha" />
    <button id="btnLogin">Login</button>
    <div id="loginResult"></div>
  </fieldset>

  <fieldset>
    <legend>Current User</legend>
    <pre id="me">{ not logged in }</pre>
    <button id="btnMe">Refresh /api/me</button>
  </fieldset>

  <fieldset>
    <legend>Create Patient (auto-fills userId from /api/me)</legend>
    <label>Patient ID</label>
    <input id="patientId" type="text" placeholder="pat-1" />
    <button id="btnCreatePatient">Create Patient</button>
    <pre id="patientResult"></pre>
  </fieldset>

  <fieldset>
    <legend>Create Professional</legend>
    <label>Professional ID</label>
    <input id="professionalId" type="text" placeholder="prof-2" />
    <label>Profession</label>
    <input id="professionalProfession" type="text" placeholder="GENERAL" />
    <button id="btnCreateProfessional">Create Professional</button>
    <pre id="professionalResult"></pre>
  </fieldset>

  <fieldset>
    <legend>Create Appointment</legend>
    <label>Professional ID</label>
    <input id="apptProfessionalId" type="text" placeholder="prof-1" />
    <label>Patient ID (leave empty to auto-link current user patient)</label>
    <input id="apptPatientId" type="text" placeholder="pat-1" />
    <label>Start (local)</label>
    <input id="apptStart" type="datetime-local" />
    <label>End (local)</label>
    <input id="apptEnd" type="datetime-local" />
    <button id="btnCreateAppt">Create Appointment</button>
    <pre id="apptResult"></pre>
  </fieldset>

  <fieldset>
    <legend>List Appointments for Professional on Date</legend>
    <label>Professional ID</label>
    <input id="listProf" type="text" placeholder="prof-1" />
    <label>Date (YYYY-MM-DD)</label>
    <input id="listDate" type="text" placeholder="2026-03-02" />
    <button id="btnListAppts">List</button>
    <pre id="listResult"></pre>
  </fieldset>

<script>
(function(){
  let token = null;
  let me = null;

  function authHeaders() {
    return token ? { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }

  async function doLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const json = await res.json();
    if (res.ok) {
      token = json.accessToken;
      document.getElementById('loginResult').innerText = 'Login ok — token stored (in memory)';
      await refreshMe();
    } else {
      document.getElementById('loginResult').innerText = 'Login error: ' + JSON.stringify(json);
    }
  }

  async function refreshMe() {
    const res = await fetch('/api/me', { headers: { 'Authorization': 'Bearer ' + token } });
    const json = await res.json();
    me = res.ok ? json : null;
    document.getElementById('me').innerText = JSON.stringify(json, null, 2);
    return json;
  }

  async function createPatient() {
    const id = document.getElementById('patientId').value || ('pat-' + Date.now());
    const userId = me?.id || null;
    const payload = { id };
    if (userId) payload.userId = userId;
    const res = await fetch('/api/patients', { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
    const json = await res.json();
    document.getElementById('patientResult').innerText = JSON.stringify(json, null, 2);
  }

  async function createProfessional() {
    const id = document.getElementById('professionalId').value || ('prof-' + Date.now());
    const profession = document.getElementById('professionalProfession').value || 'GENERAL';
    const userId = me?.id || null;
    const payload = { id, profession };
    if (userId) payload.userId = userId;
    const res = await fetch('/api/professionals', { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
    const json = await res.json();
    document.getElementById('professionalResult').innerText = JSON.stringify(json, null, 2);
  }

  function localDatetimeToISOString(inputValue) {
    if (!inputValue) return null;
    const dt = new Date(inputValue);
    return new Date(dt.getTime() - dt.getTimezoneOffset()*60000).toISOString();
  }

  async function createAppt() {
    const professionalId = document.getElementById('apptProfessionalId').value || null;
    const patientId = document.getElementById('apptPatientId').value || null;
    const startLocal = document.getElementById('apptStart').value;
    const endLocal = document.getElementById('apptEnd').value;
    const startAt = localDatetimeToISOString(startLocal);
    const endAt = localDatetimeToISOString(endLocal);
    const payload = { professionalId, patientId, startAt, endAt };
    const res = await fetch('/api/appointments', { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
    const json = await res.json();
    document.getElementById('apptResult').innerText = JSON.stringify(json, null, 2);
  }

  async function listAppts() {
    const professionalId = document.getElementById('listProf').value;
    const date = document.getElementById('listDate').value;
    const url = '/api/appointments?professionalId=' + encodeURIComponent(professionalId) + '&date=' + encodeURIComponent(date);
    const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
    const json = await res.json();
    document.getElementById('listResult').innerText = JSON.stringify(json, null, 2);
  }

  document.getElementById('btnLogin').addEventListener('click', doLogin);
  document.getElementById('btnMe').addEventListener('click', refreshMe);
  document.getElementById('btnCreatePatient').addEventListener('click', createPatient);
  document.getElementById('btnCreateProfessional').addEventListener('click', createProfessional);
  document.getElementById('btnCreateAppt').addEventListener('click', createAppt);
  document.getElementById('btnListAppts').addEventListener('click', listAppts);

})();
</script>
</body>
</html>`;
}

app.get("/demo", (_req, res) => res.send(demoHtml()));
app.get("/api/demo", (_req, res) => res.send(demoHtml()));

// Basic error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Katu backend listening on ${port}`);
});
