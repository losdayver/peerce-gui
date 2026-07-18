use std::{
    process::Child,
    sync::{Arc, Mutex},
};

use tauri::RunEvent;

pub fn run() {
    let backend: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));
    let _backend_on_setup = Arc::clone(&backend);

    let app = tauri::Builder::default()
        .setup(move |_app| {
            #[cfg(not(debug_assertions))]
            {
                let script = _app.path().resource_dir()?.join("backend/server.js");

                // Node.js cannot use Windows extended-length paths (`\\?\C:\...`)
                // as an entrypoint, so pass it the equivalent regular drive path.
                #[cfg(target_os = "windows")]
                let script = PathBuf::from(
                    script
                        .to_string_lossy()
                        .strip_prefix(r"\\?\")
                        .unwrap_or(&script.to_string_lossy()),
                );

                let mut command = Command::new("node");
                command.arg(script);

                #[cfg(target_os = "windows")]
                command.creation_flags(0x08000000);

                let child = command.spawn().map_err(|error| {
                    format!("Cannot start Node.js backend. Is Node.js installed? {error}")
                })?;

                *_backend_on_setup.lock().expect("backend lock is poisoned") = Some(child);
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("failed to build Tauri application");

    app.run(move |_app_handle, event| {
        if matches!(event, RunEvent::Exit { .. }) {
            if let Some(mut child) = backend.lock().expect("backend lock is poisoned").take() {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    });
}
