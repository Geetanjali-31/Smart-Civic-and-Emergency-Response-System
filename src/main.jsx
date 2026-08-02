import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ─── One-time Data Reset ───────────────────────────────────────────────────
// Purges all legacy test/seed data from localStorage.
// Bump DATA_SCHEMA_VERSION whenever a breaking schema change is made.
const DATA_SCHEMA_VERSION = 'v3.0-clean';
const schemaKey = 'innovista_schema_version';

if (localStorage.getItem(schemaKey) !== DATA_SCHEMA_VERSION) {
  // Keys to completely wipe
  const keysToRemove = [
    'innovista_custom_services',
    'innovista_custom_services_v1',
    'innovista_custom_services_v2',
    'innovista_custom_services_v3',
    'innovista_custom_services_v4',
    'innovista_custom_services_v5',
    'innovista_custom_services_v6',
    'innovista_notifications_v1',
    'innovista_registered_users_v2',
    'innovista_registered_users_v1',
    'innovista_registered_users',
  ];
  keysToRemove.forEach(k => { try { localStorage.removeItem(k); } catch(e){} });

  // Also remove any complaint counter keys
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('complaint_counter_') || key.startsWith('innovista_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {}

  // Mark schema as migrated
  localStorage.setItem(schemaKey, DATA_SCHEMA_VERSION);
  console.info('[SevaSetu] Data store reset to', DATA_SCHEMA_VERSION);
}
// ──────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
