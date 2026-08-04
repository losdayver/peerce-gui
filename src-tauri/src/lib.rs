#![allow(unused_imports)]

use std::{
    path::PathBuf,
    process::{Child, Command},
    sync::{Arc, Mutex},
};

use tauri::{Manager, RunEvent};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(all(target_os = "windows", not(debug_assertions)))]
const NODE_BINARY: &str = "node.exe";

#[cfg(all(target_os = "linux", not(debug_assertions)))]
const NODE_BINARY: &str = "node";

#[allow(unused_variables)]
pub fn run() {
    let backend: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));
    let backend_on_setup = Arc::clone(&backend);

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            #[cfg(not(debug_assertions))]
            {
                let resource_dir = app.path().resource_dir()?;
                let node = resource_dir.join(NODE_BINARY);
                let script = resource_dir.join("dist/backend/server.js");

                // Node.js cannot use Windows extended-length paths (`\\?\C:\...`)
                // as executable or entrypoint paths, so pass regular drive paths.
                #[cfg(target_os = "windows")]
                let node = without_windows_extended_path_prefix(node);

                #[cfg(target_os = "windows")]
                let script = without_windows_extended_path_prefix(script);

                #[cfg(target_os = "windows")]
                let resource_dir = without_windows_extended_path_prefix(resource_dir);

                let mut command = Command::new(&node);
                command
                    .arg(&script)
                    .current_dir(&resource_dir)
                    .env("NODE_ENV", "production");

                #[cfg(target_os = "windows")]
                command.creation_flags(0x08000000);

                let child = command.spawn().map_err(|error| {
                    format!(
                        "Cannot start bundled Node.js backend at {}: {error}",
                        node.display()
                    )
                })?;

                *backend_on_setup.lock().expect("backend lock is poisoned") = Some(child);
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

#[cfg(all(target_os = "windows", not(debug_assertions)))]
fn without_windows_extended_path_prefix(path: PathBuf) -> PathBuf {
    let path_string = path.to_string_lossy();

    PathBuf::from(
        path_string
            .strip_prefix(r"\\?\")
            .unwrap_or(path_string.as_ref()),
    )
}
